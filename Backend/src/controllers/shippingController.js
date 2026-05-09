import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// GET /api/shipping-addresses
export async function getMyAddresses(req, res) {
  const userId = req.user.id;
  try {
    const { rows } = await query(
      `SELECT * FROM shipping_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getMyAddresses]', err);
    return api.error(res, 'Failed to fetch addresses', 500);
  }
}

// POST /api/shipping-addresses
export async function createAddress(req, res) {
  const userId = req.user.id;
  const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
  if (!full_name?.trim() || !address_line1?.trim() || !city?.trim()) {
    return api.error(res, 'full_name, address_line1 and city are required', 400);
  }

  try {
    if (is_default) {
      await query(`UPDATE shipping_addresses SET is_default=FALSE WHERE user_id=$1`, [userId]);
    }
    const { rows } = await query(
      `INSERT INTO shipping_addresses
         (user_id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [userId, label ?? 'Home', full_name, phone ?? null, address_line1, address_line2 ?? null, city, state ?? null, postal_code ?? null, country ?? 'Palestine', is_default ?? false],
    );
    return api.created(res, rows[0], 'Address saved');
  } catch (err) {
    console.error('[createAddress]', err);
    return api.error(res, 'Failed to save address', 500);
  }
}

// PUT /api/shipping-addresses/:id
export async function updateAddress(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;

  try {
    if (is_default) {
      await query(`UPDATE shipping_addresses SET is_default=FALSE WHERE user_id=$1`, [userId]);
    }
    const { rows } = await query(
      `UPDATE shipping_addresses
       SET    label         = COALESCE($1, label),
              full_name     = COALESCE($2, full_name),
              phone         = COALESCE($3, phone),
              address_line1 = COALESCE($4, address_line1),
              address_line2 = COALESCE($5, address_line2),
              city          = COALESCE($6, city),
              state         = COALESCE($7, state),
              postal_code   = COALESCE($8, postal_code),
              country       = COALESCE($9, country),
              is_default    = COALESCE($10, is_default),
              updated_at    = NOW()
       WHERE  id=$11 AND user_id=$12
       RETURNING *`,
      [label ?? null, full_name ?? null, phone ?? null, address_line1 ?? null, address_line2 ?? null, city ?? null, state ?? null, postal_code ?? null, country ?? null, is_default ?? null, id, userId],
    );
    if (!rows.length) return api.notFound(res, 'Address not found');
    return api.success(res, rows[0], 'Address updated');
  } catch (err) {
    console.error('[updateAddress]', err);
    return api.error(res, 'Failed to update address', 500);
  }
}

// DELETE /api/shipping-addresses/:id
export async function deleteAddress(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const { rowCount } = await query(
      `DELETE FROM shipping_addresses WHERE id=$1 AND user_id=$2`, [id, userId],
    );
    if (!rowCount) return api.notFound(res, 'Address not found');
    return api.success(res, null, 'Address deleted');
  } catch (err) {
    console.error('[deleteAddress]', err);
    return api.error(res, 'Failed to delete address', 500);
  }
}

// PATCH /api/shipping-addresses/:id/default
export async function setDefaultAddress(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await query(`UPDATE shipping_addresses SET is_default=FALSE WHERE user_id=$1`, [userId]);
    const { rows } = await query(
      `UPDATE shipping_addresses SET is_default=TRUE, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, userId],
    );
    if (!rows.length) return api.notFound(res, 'Address not found');
    return api.success(res, rows[0], 'Default address updated');
  } catch (err) {
    console.error('[setDefaultAddress]', err);
    return api.error(res, 'Failed to set default', 500);
  }
}
