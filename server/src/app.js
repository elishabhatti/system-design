import express from "express";
import videoRoutes from './routes/video.routes.js';

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use('/api/videos', videoRoutes);

export { app };
