import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import cookie from "cookie"; // npm i cookie
import jwt from "jsonwebtoken"; // apna auth jo bhi use karte ho, wahi lagao
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import helmet from "helmet";

import videoRoutes from "./routes/video.routes.js";
import authRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const isProd = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

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

// error handler ke bina ioredis sirf "Unhandled error event" print karta hai
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
    const token = cookies.token; // <-- apni cookie ka naam
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.id; // <-- apne payload ki field
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Server khud user ke private room mein daalta hai
  socket.join(socket.data.userId);

  socket.on("join_video_room", (videoId) => {
    if (typeof videoId === "string" && videoId.length <= 64) {
      socket.join(`video_${videoId}`);
    }
  });

  socket.on("leave_video_room", (videoId) => {
    if (typeof videoId === "string") socket.leave(`video_${videoId}`);
  });
});

// ---------- Express middleware ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(cookieParser());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------- Routes ----------
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/videos", videoRoutes);

// ---------- 404 + error handler (routes ke BAAD) ----------
app.use((req, res) => res.status(404).json({ message: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: isProd ? "Internal server error" : err.message,
  });
});

export { app, server, io, pubClient, subClient };