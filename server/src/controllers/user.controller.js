import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PROFILE_CACHE_TTL = 3600; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

// ---------- Shared helpers ----------

// One source of truth for the user shape returned by every endpoint
const userSelect = {
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

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: SEVEN_DAYS_MS,
});

const setAuthCookie = (res, userId) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, cookieOptions());
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

// Cache failures should never break the request
const cacheUser = async (user) => {
  try {
    await redis.setex(
      profileCacheKey(user.id),
      PROFILE_CACHE_TTL,
      JSON.stringify(user),
    );
  } catch (err) {
    console.error("Redis cache write failed:", err);
  }
};

const invalidateUserCache = async (userId) => {
  try {
    await redis.del(profileCacheKey(userId));
  } catch (err) {
    console.error("Redis cache delete failed:", err);
  }
};

// ---------- Register ----------
export const register = async (req, res) => {
  try {
    const { channelName, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!channelName || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // select => password is never returned
    const newUser = await prisma.user.create({
      data: {
        channelName: channelName.trim(),
        email,
        password: hashedPassword,
      },
      select: userSelect,
    });

    setAuthCookie(res, newUser.id);
    await cacheUser(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration." });
  }
};

// ---------- Login ----------
export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // password is selected only for the compare, then stripped
    const userWithPassword = await prisma.user.findUnique({
      where: { email },
      select: { ...userSelect, password: true },
    });

    if (!userWithPassword) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const { password: _password, ...user } = userWithPassword;

    setAuthCookie(res, user.id);
    await cacheUser(user); // warm the cache so getMe is a HIT right after login

    res.json({
      message: "Logged in successfully",
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
};

// ---------- Logout ----------
export const logout = (req, res) => {
  // Must use the same options (minus maxAge) or some browsers won't clear it
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie("token", clearOptions);
  res.json({ message: "Logged out successfully" });
};

// ---------- Get current user (Redis cached) ----------
export const getMe = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = profileCacheKey(userId);

    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cachedUser));
      }
    } catch (err) {
      console.error("Redis cache read failed:", err);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await cacheUser(user);

    res.setHeader("X-Cache", "MISS");
    res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// ---------- Update profile ----------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelName, bio, avatarUrl, bannerUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(channelName && { channelName: channelName.trim() }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      },
      select: userSelect,
    });

    await cacheUser(updatedUser);

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error while updating profile" });
  }
};

// ---------- Toggle subscription ----------
export const toggleSubscription = async (req, res) => {
  try {
    const subscriberId = req.userId;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res
        .status(400)
        .json({ error: "Aap apne channel ko subscribe nahi kar sakte." });
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId, channelId } },
    });

    let isSubscribed;

    if (existingSubscription) {
      // deleteMany doesn't throw if a concurrent request already deleted it
      await prisma.subscription.deleteMany({
        where: { subscriberId, channelId },
      });
      isSubscribed = false;
    } else {
      try {
        await prisma.subscription.create({ data: { subscriberId, channelId } });
      } catch (err) {
        // P2002 = unique constraint: a concurrent request (double-click) already created it
        if (err.code !== "P2002") throw err;
      }
      isSubscribed = true;
    }

    const subscriberCount = await prisma.subscription.count({
      where: { channelId },
    });

    // The channel's cached profile contains `subscribers`, so it is now stale
    await invalidateUserCache(channelId);

    res.status(200).json({
      success: true,
      isSubscribed,
      subscriberCount,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------- Get all subscriptions ----------
export const getAllSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;

    const subscriptions = await prisma.subscription.findMany({
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

    const subscribedChannels = subscriptions.map((sub) => sub.channel);

    res.status(200).json({ success: true, subscriptions: subscribedChannels });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
