import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";

// Apka Redis client connection (agar pehle se koi global client hai toh woh bhi import kar sakte hain)
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

// 1. Auth/Login/Register ke liye strict limiter (Brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes from the same IP
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - Known type mismatch between ioredis and rate-limit-redis sometimes
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    success: false,
    message: "Too many login/register attempts from this IP, please try again after 15 minutes.",
  },
});

// 2. General API limiter (Optional, agar baqi routes par bhi lagana ho)
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
});