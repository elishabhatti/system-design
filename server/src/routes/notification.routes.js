import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read', protect, markAsRead);

export default router;