import { query } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/profile
// ---------------------------------------------------------------------------
export async function getProfile(req, res) {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT id, name, email, phone, role, created_at, updated_at
       FROM   users
       WHERE  id = $1`,
      [userId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'User not found');
    }

    return api.success(res, result.rows[0]);
  } catch (err) {
    console.error('[getProfile]', err);
    return api.error(res, 'Failed to fetch profile', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/profile
// ---------------------------------------------------------------------------
export async function updateProfile(req, res) {
  const userId      = req.user.id;
  const { name, phone } = req.body;

  if (!name && !phone) {
    return api.error(res, 'Provide at least one field to update (name, phone)');
  }

  try {
    const result = await query(
      `UPDATE users
       SET    name       = COALESCE($1, name),
              phone      = COALESCE($2, phone),
              updated_at = NOW()
       WHERE  id = $3
       RETURNING id, name, email, phone, role, updated_at`,
      [name ?? null, phone ?? null, userId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'User not found');
    }

    return api.success(res, result.rows[0], 'Profile updated');
  } catch (err) {
    console.error('[updateProfile]', err);
    return api.error(res, 'Failed to update profile', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/profile/password
// ---------------------------------------------------------------------------
export async function changePassword(req, res) {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return api.error(res, 'current_password and new_password are required');
  }

  if (new_password.length < 8) {
    return api.error(res, 'New password must be at least 8 characters long');
  }

  if (!/\d/.test(new_password)) {
    return api.error(res, 'New password must contain at least one number');
  }

  try {
    const userRes = await query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId],
    );

    if (userRes.rowCount === 0) {
      return api.notFound(res, 'User not found');
    }

    const isMatch = await verifyPassword(current_password, userRes.rows[0].password_hash);

    if (!isMatch) {
      return api.error(res, 'Current password is incorrect', 401);
    }

    const newHash = await hashPassword(new_password);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId],
    );

    return api.success(res, null, 'Password changed successfully');
  } catch (err) {
    console.error('[changePassword]', err);
    return api.error(res, 'Failed to change password', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/profile/addresses
// Returns distinct shipping addresses from the user's orders (from JSONB)
// ---------------------------------------------------------------------------
export async function getAddresses(req, res) {
  const userId = req.user.id;

  try {
    const { rows } = await query(
      `SELECT DISTINCT ON (shipping_address::TEXT)
              shipping_address,
              MAX(created_at) AS last_used_at
       FROM   orders
       WHERE  user_id = $1
         AND  shipping_address <> '{}'::JSONB
       GROUP  BY shipping_address::TEXT, shipping_address
       ORDER  BY shipping_address::TEXT, last_used_at DESC`,
      [userId],
    );

    const addresses = rows.map((r) => ({
      ...r.shipping_address,
      last_used_at: r.last_used_at,
    }));

    return api.success(res, addresses);
  } catch (err) {
    console.error('[getAddresses]', err);
    return api.error(res, 'Failed to fetch addresses', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/profile/picture
// Expects multer middleware to have run (req.file populated)
// ---------------------------------------------------------------------------
export async function updateProfilePicture(req, res) {
  const userId = req.user.id;

  if (!req.file) {
    return api.error(res, 'No image file uploaded');
  }

  // Build the public URL from the stored file path
  // Multer (upload middleware) stores files in /uploads — build a URL accordingly
  const baseUrl   = `${req.protocol}://${req.get('host')}`;
  const imageUrl  = `${baseUrl}/uploads/${req.file.filename}`;

  try {
    const result = await query(
      `UPDATE users
       SET    profile_picture_url = $1,
              updated_at          = NOW()
       WHERE  id = $2
       RETURNING id, name, email, profile_picture_url, updated_at`,
      [imageUrl, userId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'User not found');
    }

    return api.success(res, result.rows[0], 'Profile picture updated');
  } catch (err) {
    // profile_picture_url column may not exist yet — surface clearly
    if (err.code === '42703') {
      return api.error(
        res,
        'profile_picture_url column does not exist in users table. Run the migration first.',
        500,
      );
    }
    console.error('[updateProfilePicture]', err);
    return api.error(res, 'Failed to update profile picture', 500);
  }
}
