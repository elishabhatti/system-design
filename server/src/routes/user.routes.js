import express from 'express';
import { register, login, logout, getMe, updateProfile, toggleSubscription, getAllSubscriptions } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

router.post('/register', authLimiter , register);
router.post('/login', authLimiter, login);
router.post('/logout', authLimiter, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/channels/:channelId/subscribe', protect, toggleSubscription);
router.get('/subscriptions', protect, getAllSubscriptions);

export default router;