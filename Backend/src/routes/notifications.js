import { Router } from 'express';
import {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  sendNotification,
  getUnreadCount,
} from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

router.get('/',                auth, getMyNotifications);
router.get('/unread-count',    auth, getUnreadCount);
router.patch('/read-all',      auth, markAllRead);
router.patch('/:id/read',      auth, markRead);
router.delete('/:id',          auth, deleteNotification);
router.post('/send',           adminAuth, sendNotification);

export default router;
