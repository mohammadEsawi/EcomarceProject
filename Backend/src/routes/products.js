import { Router } from 'express';
import {
  getProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addProductVariant,
  updateInventory,
} from '../controllers/productController.js';
import adminAuth from '../middleware/adminAuth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/', generalLimiter, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id', getProduct);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.post('/', adminAuth, createProduct);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);
router.post('/:id/images', adminAuth, uploadMultiple, uploadProductImages);
router.post('/:id/variants', adminAuth, addProductVariant);
router.put('/variants/:variantId/inventory', adminAuth, updateInventory);

export default router;
