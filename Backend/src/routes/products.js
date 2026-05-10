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
  addVariantByName,
  getProductVariants,
  deleteVariant,
  updateInventory,
} from '../controllers/productController.js';
import adminAuth from '../middleware/adminAuth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id', getProduct);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.post('/', adminAuth, createProduct);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);
router.post('/:id/images', adminAuth, uploadMultiple, uploadProductImages);
router.get('/:id/variants', adminAuth, getProductVariants);
router.post('/:id/variants', adminAuth, addProductVariant);
router.post('/:id/variants/simple', adminAuth, addVariantByName);
router.delete('/variants/:variantId', adminAuth, deleteVariant);
router.put('/variants/:variantId/inventory', adminAuth, updateInventory);

export default router;
