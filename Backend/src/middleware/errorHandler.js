import { validationResult } from 'express-validator';

/**
 * Convenience helper: run express-validator checks and respond with 422
 * if any validation errors exist. Call at the top of a route handler.
 *
 * Usage:
 *   import { handleValidation } from '../middleware/errorHandler.js';
 *   router.post('/route', [...validators], (req, res) => {
 *     if (!handleValidation(req, res)) return;
 *     // ... rest of handler
 *   });
 */
export function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array(),
    });
    return false;
  }
  return true;
}

/**
 * Global error-handler middleware (must have 4 parameters so Express
 * recognises it as an error handler).
 *
 * Handles:
 *  - express-validator ValidationError arrays (passed via next(errors))
 *  - PostgreSQL unique_violation (23505) and foreign_key_violation (23503)
 *  - JWT errors (JsonWebTokenError, TokenExpiredError, NotBeforeError)
 *  - Generic fallback 500
 *
 * Stack traces are only included in development mode.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // ── express-validator: array of FieldValidationError ──────────────────────
  if (Array.isArray(err) && err[0]?.type === 'field') {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: err,
    });
  }

  // ── express-validator: result object passed directly ──────────────────────
  if (err?.errors && Array.isArray(err.errors)) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // ── PostgreSQL errors ─────────────────────────────────────────────────────
  if (err?.code === '23505') {
    // unique_violation
    const detail = err.detail || '';
    const match = detail.match(/Key \((.+?)\)=\((.+?)\) already exists/);
    const field = match ? match[1] : 'field';
    const value = match ? match[2] : '';
    return res.status(409).json({
      message: `A record with this ${field} (${value}) already exists.`,
      ...(isDev && { detail }),
    });
  }

  if (err?.code === '23503') {
    // foreign_key_violation
    const detail = err.detail || '';
    return res.status(400).json({
      message: 'Referenced resource does not exist.',
      ...(isDev && { detail }),
    });
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err?.name === 'TokenExpiredError') {
    return res.status(403).json({ message: 'Token expired. Please log in again.' });
  }

  if (
    err?.name === 'JsonWebTokenError' ||
    err?.name === 'NotBeforeError'
  ) {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  // ── Default 500 ───────────────────────────────────────────────────────────
  const statusCode = err?.statusCode || err?.status || 500;
  const message =
    isDev || statusCode < 500
      ? err?.message || 'An unexpected error occurred.'
      : 'Internal server error.';

  console.error('[ErrorHandler]', err);

  return res.status(statusCode).json({
    message,
    ...(isDev && { stack: err?.stack }),
  });
};

export default errorHandler;
