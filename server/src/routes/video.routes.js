import { Router } from 'express';
import { getVideos, uploadVideo, deleteVideo, incrementVideoView } from '../controllers/video.controller.js';
import { upload } from '../config/cloudinary.js'; // Yeh aapka Cloudinary wala multer middleware hona chahiye
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/upload', protect, upload.single('video'), uploadVideo);
router.get('/', getVideos);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/view', protect, incrementVideoView);

export default router;