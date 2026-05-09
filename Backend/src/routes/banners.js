import { Router } from 'express';
import { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

router.get('/',       getBanners);
router.get('/all',    adminAuth, getAllBanners);
router.post('/',      adminAuth, createBanner);
router.put('/:id',    adminAuth, updateBanner);
router.delete('/:id', adminAuth, deleteBanner);

export default router;
