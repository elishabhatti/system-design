import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

import videoRoutes from "./routes/video.routes.js";
import authRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

// ---------- Config ----------
const isProd = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// TODO: apne auth ke hisaab se badlo
const AUTH_COOKIE_NAME = "token"; // tumhari login cookie ka naam
const getUserIdFromPayload = (payload) => payload.id; // JWT payload ki field

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/; // room ids ki validation

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

// ---------- Redis ----------
const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};
const pubClient = new Redis(redisOptions);
const subClient = pubClient.duplicate();

// error handler ke bina ioredis "Unhandled error event" spam karta hai
pubClient.on("error", (e) => console.error("Redis pub error:", e.message));
subClient.on("error", (e) => console.error("Redis sub error:", e.message));

// ---------- Socket.io ----------
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});
io.adapter(createAdapter(pubClient, subClient));
app.set("io", io);

// Handshake par auth: client ki bheji hui userId par bharosa nahi
io.use((socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies[AUTH_COOKIE_NAME] || socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return next(new Error("Unauthorized"));

    socket.data.userId = String(userId);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Server khud user ko uske private room mein daalta hai
  socket.join(socket.data.userId);

  socket.on("join_video_room", (videoId) => {
    if (typeof videoId === "string" && SAFE_ID.test(videoId)) {
      socket.join(`video_${videoId}`);
    }
  });

  socket.on("leave_video_room", (videoId) => {
    if (typeof videoId === "string" && SAFE_ID.test(videoId)) {
      socket.leave(`video_${videoId}`);
    }
  });
});

// ---------- Express middleware ----------
// crossOriginResourcePolicy: "cross-origin" zaroori hai, warna frontend
// (localhost:5173) backend (localhost:5000) ke HLS segments load nahi kar paata.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// HLS output (master.m3u8 + segments) jo worker banata hai.
// Worker aur server dono backend root se start hone chahiye taake
// process.cwd() same rahe. CORS upar wala global cors() already handle karta hai.
app.use(
  "/hls",
  express.static(path.join(process.cwd(), "public", "hls"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Cache-Control", "no-cache"); // master/playlists badalti hain
      } else if (filePath.endsWith(".ts")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // segments kabhi nahi badalte
      }
    },
  })
);

// ---------- Routes ----------
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/videos", videoRoutes);

// ---------- 404 + error handler (routes ke BAAD) ----------
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: isProd ? "Internal server error" : err.message,
  });
});

export { app, server, io, pubClient, subClient };