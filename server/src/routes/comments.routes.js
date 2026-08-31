import { Router } from 'express';
import { getCommentsByVideo, addComment, updateComment, deleteComment } from '../controllers/comments.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:videoId/comments', getCommentsByVideo);
router.post('/:videoId/comments', protect, addComment);
router.put('/comments/:commentId', protect, updateComment);  
router.delete('/comments/:commentId', protect, deleteComment);

export default router;