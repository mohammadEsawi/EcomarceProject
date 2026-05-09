import { Router } from 'express';
import {
  getOverview,
  getSalesChart,
  getTopProducts,
  getCategoryBreakdown,
  getOrderStatusBreakdown,
  getInventoryHealth,
  getRecentActivity,
} from '../controllers/analyticsController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

router.get('/overview',           adminAuth, getOverview);
router.get('/sales',              adminAuth, getSalesChart);
router.get('/top-products',       adminAuth, getTopProducts);
router.get('/category-breakdown', adminAuth, getCategoryBreakdown);
router.get('/order-status',       adminAuth, getOrderStatusBreakdown);
router.get('/inventory-health',   adminAuth, getInventoryHealth);
router.get('/recent-activity',    adminAuth, getRecentActivity);

export default router;
