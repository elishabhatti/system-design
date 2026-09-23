import { Router } from 'express';
import { upload } from '../config/cloudinary.js'; 
import { protect } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';
import { uploadVideo, deleteVideo, getVideos, incrementVideoView, toggleVideoLike } from '../controllers/video.controller.js';

const router = Router();

router.post('/upload', protect, upload.single('video'), uploadVideo);
router.get('/', getVideos);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/view', protect, apiLimiter, incrementVideoView);
router.post('/:videoId/like', protect, apiLimiter, toggleVideoLike);

export default router;