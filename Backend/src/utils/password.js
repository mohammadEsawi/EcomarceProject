import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 * @param {string} password - Plain-text password
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * @param {string} password - Plain-text password to check
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} true if they match
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength rules:
 *  - At least 8 characters
 *  - Contains at least one digit
 *
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true };
}
