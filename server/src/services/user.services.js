import prisma, { prismaRead } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

const PROFILE_CACHE_TTL = 3600; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

// Login pe user na mile tab bhi bcrypt chalta hai, taake timing se email guess na ho
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

// ---------- Helpers ----------

// One source of truth for the user shape
export const userSelect = {
  id: true,
  channelName: true,
  email: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  bannerUrl: true,
  subscribers: true,
};

const profileCacheKey = (userId) => `user:profile:${userId}`;

// Secret function ke andar padhte hain (module load pe nahi), warna dotenv
// late load ho to JWT_SECRET undefined reh jata hai
export const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

// Cache best-effort hai: Redis down ho to API na mare
const cacheUser = async (user) => {
  try {
    await redis.setex(
      profileCacheKey(user.id),
      PROFILE_CACHE_TTL,
      JSON.stringify(user),
    );
  } catch (err) {
    console.error("Redis cache write failed:", err.message);
  }
};

const invalidateUserCache = async (userId) => {
  try {
    await redis.del(profileCacheKey(userId));
  } catch (err) {
    console.error("Redis cache delete failed:", err.message);
  }
};

// ---------- Register ----------
// Level: STRONG (primary). Unique index email pe race handle karta hai.
export const registerUser = async ({ channelName, email, password }) => {
  const cleanEmail = normalizeEmail(email);

  if (!channelName || !cleanEmail || !password) {
    return { status: "invalid", error: "All fields are required." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "invalid",
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        channelName: channelName.trim(),
        email: cleanEmail,
        password: hashedPassword,
      },
      select: userSelect,
    });

    await cacheUser(user);
    return { status: "ok", user, token: signToken(user.id) };
  } catch (err) {
    // P2002 = unique constraint (email). findUnique-then-create wali race yahin pakri jati hai
    if (err.code === "P2002") return { status: "email_taken" };
    throw err;
  }
};

// ---------- Login ----------
export const loginUser = async ({ email, password }) => {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    return { status: "invalid", error: "Email and password are required." };
  }

  const userWithPassword = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { ...userSelect, password: true },
  });

  const isMatch = await bcrypt.compare(
    password,
    userWithPassword?.password ?? DUMMY_HASH,
  );

  if (!userWithPassword || !isMatch) {
    return { status: "invalid_credentials" };
  }

  const { password: _password, ...user } = userWithPassword;

  await cacheUser(user); // getMe login ke foran baad HIT ho
  return { status: "ok", user, token: signToken(user.id) };
};

// ---------- Get current user (Redis cached) ----------
// Level: EVENTUAL (cache), miss pe primary se.
export const getCurrentUser = async ({ userId }) => {
  try {
    const cached = await redis.get(profileCacheKey(userId));
    if (cached) return { status: "ok", user: JSON.parse(cached), source: "HIT" };
  } catch (err) {
    console.error("Redis cache read failed:", err.message);
  }

  const user = await prismaRead.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) return { status: "not_found" };

  await cacheUser(user);
  return { status: "ok", user, source: "MISS" };
};

// ---------- Update profile ----------
// Level: STRONG (primary pe write), phir cache refresh.
export const updateUserProfile = async ({ userId, data }) => {
  const { channelName, bio, avatarUrl, bannerUrl } = data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(channelName && { channelName: channelName.trim() }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bannerUrl !== undefined && { bannerUrl }),
    },
    select: userSelect,
  });

  await cacheUser(user);
  return { status: "ok", user };
};

// ---------- Toggle subscription ----------
// Level: STRONG. Composite unique (subscriberId, channelId) double-click race rokta hai.
export const toggleSubscription = async ({ subscriberId, channelId }) => {
  if (subscriberId === channelId) return { status: "self_subscribe" };

  const removed = await prisma.subscription.deleteMany({
    where: { subscriberId, channelId },
  });

  let isSubscribed = false;

  if (removed.count === 0) {
    try {
      await prisma.subscription.create({ data: { subscriberId, channelId } });
      isSubscribed = true;
    } catch (err) {
      if (err.code === "P2002") {
        isSubscribed = true; // concurrent request pehle bana chuki
      } else if (err.code === "P2003") {
        return { status: "not_found" }; // channel exist nahi karta
      } else {
        throw err;
      }
    }
  }

  const subscriberCount = await prisma.subscription.count({
    where: { channelId },
  });

  // Channel ke cached profile mein subscribers hai, ab stale
  await invalidateUserCache(channelId);

  return { status: "ok", isSubscribed, subscriberCount };
};

// ---------- Get all subscriptions ----------
export const getUserSubscriptions = async ({ userId }) => {
  const subscriptions = await prismaRead.subscription.findMany({
    where: { subscriberId: userId },
    include: {
      channel: {
        select: {
          id: true,
          channelName: true,
          avatarUrl: true,
          bio: true,
          bannerUrl: true,
        },
      },
    },
  });

  return { status: "ok", channels: subscriptions.map((s) => s.channel) };
};