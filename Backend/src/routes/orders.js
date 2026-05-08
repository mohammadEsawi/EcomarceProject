import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/orderController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// ── Authenticated user routes ────────────────────────────────────────────────
router.post('/', auth, createOrder);
router.get('/my', auth, getMyOrders);
router.get('/:id', auth, getOrderById);
router.patch('/:id/cancel', auth, cancelOrder);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', adminAuth, getAllOrders);
router.patch('/:id/status', adminAuth, updateOrderStatus);

export default router;
