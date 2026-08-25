import express from "express";
import videoRoutes from "./routes/video.routes.js";
import authRoutes from "./routes/user.routes.js";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io); 

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_video_room", (videoId) => {
    socket.join(`video_${videoId}`);
    console.log(`User joined room: video_${videoId}`);
  });

  socket.on("leave_video_room", (videoId) => {
    socket.leave(`video_${videoId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);

export { app, server };
