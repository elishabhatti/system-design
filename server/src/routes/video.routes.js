import { Router } from 'express';
import multer from 'multer';
import { getVideos, uploadVideo } from '../controllers/video.controller.js';
import { upload } from '../config/cloudinary.js';

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

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/', getVideos);

export default router;