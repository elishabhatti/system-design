import { Router } from 'express';
import { getCommentsByVideo, addComment } from '../controllers/comments.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:videoId/comments', getCommentsByVideo);
router.post('/:videoId/comments', protect, addComment);

export default router;