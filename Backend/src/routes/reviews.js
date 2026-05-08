import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  hideReview,
} from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/product/:productId', getProductReviews);

// ── Authenticated user routes ────────────────────────────────────────────────
router.post('/product/:productId', auth, createReview);
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview);
router.post('/:id/helpful', auth, markHelpful);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.patch('/:id/hide', adminAuth, hideReview);

export default router;
