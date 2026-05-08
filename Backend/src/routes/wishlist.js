import { Router } from 'express';
import {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import auth from '../middleware/auth.js';

const router = Router();

// All wishlist routes require authentication
router.get('/', auth, getWishlist);
router.post('/toggle', auth, toggleWishlist);
router.delete('/:productId', auth, removeFromWishlist);

export default router;
