import { Router } from 'express';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/shippingController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/',            auth, getMyAddresses);
router.post('/',           auth, createAddress);
router.put('/:id',         auth, updateAddress);
router.delete('/:id',      auth, deleteAddress);
router.patch('/:id/default', auth, setDefaultAddress);

export default router;
