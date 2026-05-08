import { Router } from 'express';
import {
  getDashboardStats,
  createAdminAccount,
  getAdminProfile,
  getAllUsers,
} from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// All routes require admin JWT
router.get('/dashboard', adminAuth, getDashboardStats);
router.post('/accounts', adminAuth, createAdminAccount);
router.get('/profile', adminAuth, getAdminProfile);
router.get('/users', adminAuth, getAllUsers);

export default router;
