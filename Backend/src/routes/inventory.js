import { Router } from 'express';
import {
  getStockAlerts,
  resolveAlert,
  getInventoryReport,
  updateStock,
} from '../controllers/inventoryController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// All inventory routes are admin-only
router.get('/alerts', adminAuth, getStockAlerts);
router.patch('/alerts/:id/resolve', adminAuth, resolveAlert);
router.get('/report', adminAuth, getInventoryReport);
router.patch('/stock/:variantId', adminAuth, updateStock);

export default router;
