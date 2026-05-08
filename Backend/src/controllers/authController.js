/**
 * Authentication controller.
 * Handles user registration, login, profile retrieval, and admin login.
 * All DB access goes through parameterized queries – never string interpolation.
 */

import { query } from '../config/database.js';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/tokens.js';
import * as respond from '../utils/apiResponse.js';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Strip sensitive fields from a users-table row before sending it to the client. */
function sanitizeUser(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

/** Strip sensitive fields from an admins-table row. */
function sanitizeAdmin(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

/** Basic e-mail format check (no external deps). */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// ─── register ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { user, token }
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body ?? {};

    // ── validation ───────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return respond.error(res, 'name, email and password are required', 400);
    }

    if (!isValidEmail(email)) {
      return respond.error(res, 'Invalid email address', 400);
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return respond.error(res, pwCheck.message, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // ── uniqueness check ─────────────────────────────────────────────────────
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail],
    );

    if (existing.rowCount > 0) {
      return respond.error(res, 'Email already registered', 409);
    }

    // ── create user ──────────────────────────────────────────────────────────
    const password_hash = await hashPassword(password);

    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, 'customer', NOW())
       RETURNING id, name, email, role, created_at`,
      [String(name).trim(), normalizedEmail, password_hash],
    );

    const user = insertResult.rows[0];
    const token = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    return respond.created(res, { user, token }, 'Registration successful');
  } catch (err) {
    return next(err);
  }
}

// ─── login (unified: checks users then admins) ───────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { user, token, role }
 * Checks the users table first; falls back to admins table.
 * Role 'admin' in the response means the caller should redirect to the dashboard.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return respond.error(res, 'Email and password are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // ── 1. Check users table ─────────────────────────────────────────────────
    const userResult = await query(
      `SELECT id, name, email, password_hash, role, created_at
         FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail],
    );

    if (userResult.rowCount > 0) {
      const row = userResult.rows[0];
      if (!(await verifyPassword(password, row.password_hash))) {
        return respond.unauthorized(res, 'Invalid credentials');
      }
      const user = sanitizeUser(row);
      const token = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      return respond.success(res, { user, token, role: user.role }, 'Login successful');
    }

    // ── 2. Fall back to admins table ─────────────────────────────────────────
    const adminResult = await query(
      `SELECT id, name, email, password_hash, created_at
         FROM admins WHERE email = $1 LIMIT 1`,
      [normalizedEmail],
    );

    if (adminResult.rowCount > 0) {
      const row = adminResult.rows[0];
      if (!(await verifyPassword(password, row.password_hash))) {
        return respond.unauthorized(res, 'Invalid credentials');
      }
      const admin = sanitizeAdmin(row);
      const token = generateAccessToken({ id: admin.id, email: admin.email, role: 'admin' });
      return respond.success(res, { user: admin, token, role: 'admin' }, 'Login successful');
    }

    return respond.unauthorized(res, 'Invalid credentials');
  } catch (err) {
    return next(err);
  }
}

// ─── getMe ───────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Requires: valid JWT (req.user populated by auth middleware)
 * Returns: { user }
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      return respond.unauthorized(res, 'Authentication required');
    }

    const result = await query(
      `SELECT id, name, email, role, phone, created_at, updated_at
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return respond.notFound(res, 'User not found');
    }

    return respond.success(res, { user: result.rows[0] });
  } catch (err) {
    return next(err);
  }
}

// ─── adminLogin ───────────────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Body: { email, password }
 * Returns: { admin, token }
 *
 * Looks up the admins table (separate from users).
 * The token payload includes role: 'admin' so middleware can gate admin routes.
 */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return respond.error(res, 'Email and password are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await query(
      `SELECT id, name, email, password_hash, created_at
         FROM admins
        WHERE email = $1
        LIMIT 1`,
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return respond.unauthorized(res, 'Invalid admin credentials');
    }

    const row = result.rows[0];
    const valid = await verifyPassword(password, row.password_hash);

    if (!valid) {
      return respond.unauthorized(res, 'Invalid admin credentials');
    }

    const admin = sanitizeAdmin(row);
    const token = generateAccessToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    return respond.success(res, { admin, token }, 'Admin login successful');
  } catch (err) {
    return next(err);
  }
}
