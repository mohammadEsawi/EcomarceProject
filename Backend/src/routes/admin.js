import { Router } from 'express';
import { adminLogin } from '../controllers/authController.js';
import {
  getDashboardStats,
  createAdminAccount,
  getAdminProfile,
} from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Login is public but rate-limited
router.post('/login', authLimiter, adminLogin);

// Dashboard and account management require admin JWT
router.get('/dashboard', adminAuth, getDashboardStats);
router.post('/accounts', adminAuth, createAdminAccount);
router.get('/profile', adminAuth, getAdminProfile);

export default router;
