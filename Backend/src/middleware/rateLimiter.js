import rateLimit from 'express-rate-limit';

/**
 * General limiter: 100 requests per 15 minutes.
 * Apply to all routes as a baseline protection.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
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
