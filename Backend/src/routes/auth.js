import { Router } from 'express';
import { register, login, getMe, adminLogin } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { body, validationResult } from 'express-validator';

const router = Router();

/** Inline validation middleware: responds 422 on any express-validator error. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed.', errors: errors.array() });
  }
  return next();
}

router.post(
  '/register',
  authLimiter,
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  handleValidation,
  register,
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  handleValidation,
  login,
);

router.get('/me', auth, getMe);

router.post('/admin/login', authLimiter, adminLogin);

export default router;
