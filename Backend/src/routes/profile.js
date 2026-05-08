import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  updateProfilePicture,
} from '../controllers/profileController.js';
import auth from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

// All profile routes require authentication
router.get('/', auth, getProfile);
router.put('/', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.get('/addresses', auth, getAddresses);
router.post('/picture', auth, uploadSingle, updateProfilePicture);

export default router;
