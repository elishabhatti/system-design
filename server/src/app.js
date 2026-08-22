import express from "express";
import videoRoutes from './routes/video.routes.js';
import authRoutes from './routes/user.routes.js';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

export { app };
