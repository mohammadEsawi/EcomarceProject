import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set.');
  return secret;
};

/**
 * Generate a short-lived access token (12 hours).
 * @param {object} payload - Data to embed (e.g. { id, email, role })
 * @returns {string} Signed JWT
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '12h' });
}

/**
 * Generate a long-lived refresh token (7 days).
 * @param {object} payload - Data to embed (e.g. { id, email })
 * @returns {string} Signed JWT
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

/**
 * Verify a token and return its decoded payload.
 * Throws a jwt error (JsonWebTokenError, TokenExpiredError, etc.) on failure.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

// ── Legacy aliases kept for backward-compatibility with existing routes ──────
/** @deprecated Use generateAccessToken instead */
export const signAccessToken = (user) =>
  generateAccessToken({ sub: user._id ?? user.id, email: user.email, role: user.role, name: user.name });

/** @deprecated Use verifyToken instead */
export const verifyAccessToken = verifyToken;
