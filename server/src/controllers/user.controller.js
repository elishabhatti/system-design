import prisma from '../config/db.js';  
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redis from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Register Controller
export const register = async (req, res) => {
  try {
    const { channelName, email, password } = req.body;

    if (!channelName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        channelName,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT Token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, channelName: newUser.channelName, email: newUser.email },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, channelName: user.channelName, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// Logout Controller
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// 1. Get Logged-in User Profile with Redis Caching
export const getMe = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `user:profile:${userId}`;

    // Step A: Check Redis Cache first
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      // Cache HIT: Fast response from RAM
      res.setHeader("X-Cache", "HIT");
      return res.json({ user: JSON.parse(cachedUser) });
    }

    // Step B: Cache MISS: Fetch from Database (Prisma)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step C: Save data to Redis cache with TTL (e.g., 1 hour = 3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(user));

    res.setHeader("X-Cache", "MISS");
    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 2. Update Profile & Invalidate / Update Cache
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; 
    const { channelName, bio, avatarUrl, bannerUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(channelName && { channelName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      },
    });

    // Cache Invalidation / Update: Naya data foran Redis mein overwrite kar do
    const cacheKey = `user:profile:${userId}`;
    await redis.setex(cacheKey, 3600, JSON.stringify(updatedUser));

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error while updating profile" });
  }
};
export const toggleSubscription = async (req, res) => {
  try {
    const subscriberId = req.userId;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res.status(400).json({ error: "Aap apne channel ko subscribe nahi kar sakte." });
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId,
          channelId,
        },
      },
    });

    let isSubscribed;

    if (existingSubscription) {
      await prisma.subscription.delete({
        where: { id: existingSubscription.id },
      });
      isSubscribed = false;
    } else {
      await prisma.subscription.create({
        data: {
          subscriberId,
          channelId,
        },
      });
      isSubscribed = true;
    }

    const subscriberCount = await prisma.subscription.count({
      where: { channelId },
    });

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

    const subscribedChannels = subscriptions.map(sub => sub.channel);

    res.status(200).json({ success: true, subscriptions: subscribedChannels });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}