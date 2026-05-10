import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * General limiter: 500 req/15 min in production, skipped in development.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

/**
 * Auth limiter: 10 requests per 15 minutes.
 * Apply to /login and /register to slow brute-force attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Upload limiter: 20 requests per hour.
 * Apply to file-upload endpoints to prevent storage abuse.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Upload limit reached. Please try again after 1 hour.',
  },
});
