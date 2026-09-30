import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 600000, // 10 min; slow connections + big videos need more than the default
});

// Kept for any OTHER route that still imports `upload` (e.g. avatar upload).
// Video uploads now go through middleware/uploadVideo.middleware.js instead.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videos_streaming_app',
    resource_type: 'video',
  },
});

const upload = multer({ storage: storage });

export { cloudinary, upload };