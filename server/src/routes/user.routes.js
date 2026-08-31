import express from 'express';
import { register, login, logout, getMe, updateProfile, toggleSubscription, getAllSubscriptions } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/channels/:channelId/subscribe', protect, toggleSubscription);
router.get('/subscriptions', protect, getAllSubscriptions);

export default router;