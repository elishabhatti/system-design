import { Router } from 'express';
import multer from 'multer';
import { getVideos, uploadVideo, deleteVideo, incrementVideoView } from '../controllers/video.controller.js';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

router.post('/upload', protect, upload.single('video'), uploadVideo);
router.get('/', getVideos);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/view', protect, incrementVideoView);

export default router;