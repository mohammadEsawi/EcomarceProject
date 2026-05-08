import { Router } from 'express';
import {
  getActiveCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
} from '../controllers/couponController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.post('/', adminAuth, createCoupon);
router.put('/:id', adminAuth, updateCoupon);
router.delete('/:id', adminAuth, deactivateCoupon);

export default router;
