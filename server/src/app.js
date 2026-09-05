import express from "express";
import videoRoutes from "./routes/video.routes.js";
import authRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import noficationRoutes from "./routes/notification.routes.js";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import helmet from "helmet";

const app = express();
const server = http.createServer(app);

// 1. Environment variables ke sath Redis pub/sub clients
const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT

const pubClient = new Redis({ host: redisHost, port: redisPort });
const subClient = pubClient.duplicate();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.adapter(createAdapter(pubClient, subClient));

app.set("io", io); 

io.on("connection", (socket) => {
  socket.on("joinRoom", (userId) => {
    if (userId) {
      socket.join(userId);
    }
  });

  socket.on("join_video_room", (videoId) => {
    socket.join(`video_${videoId}`);
  });

  socket.on("leave_video_room", (videoId) => {
    socket.leave(`video_${videoId}`);
  });

  socket.on("disconnect", () => {});
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", noficationRoutes);
app.use("/api/videos", videoRoutes);

export { app, server };