import { Router } from 'express';
import { getBrands, getBrand, createBrand, updateBrand, deleteBrand } from '../controllers/brandController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

router.get('/',     getBrands);
router.get('/:id',  getBrand);
router.post('/',    adminAuth, createBrand);
router.put('/:id',  adminAuth, updateBrand);
router.delete('/:id', adminAuth, deleteBrand);

export default router;
