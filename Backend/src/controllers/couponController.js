import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/coupons/active
// ---------------------------------------------------------------------------
export async function getActiveCoupons(req, res) {
  try {
    const { rows } = await query(
      `SELECT id, code, discount_type, discount_value,
              min_order_amount, max_uses, used_count, expires_at, created_at
       FROM   coupons
       WHERE  is_active   = TRUE
         AND  (expires_at IS NULL OR expires_at > NOW())
         AND  (max_uses   IS NULL OR used_count < max_uses)
       ORDER  BY created_at DESC`,
    );

    return api.success(res, rows);
  } catch (err) {
    console.error('[getActiveCoupons]', err);
    return api.error(res, 'Failed to fetch coupons', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons/validate
// ---------------------------------------------------------------------------
export async function validateCoupon(req, res) {
  const { code, order_amount } = req.body;

  if (!code) {
    return api.error(res, 'code is required');
  }

  const amount = parseFloat(order_amount);

  if (isNaN(amount) || amount < 0) {
    return api.error(res, 'order_amount must be a non-negative number');
  }

  try {
    const couponRes = await query(
      `SELECT id, code, discount_type, discount_value,
              min_order_amount, max_uses, used_count, expires_at, is_active
       FROM   coupons
       WHERE  UPPER(code) = UPPER($1)`,
      [code],
    );

    if (couponRes.rowCount === 0) {
      return api.success(res, { valid: false, reason: 'Coupon not found' });
    }

    const coupon = couponRes.rows[0];

    if (!coupon.is_active) {
      return api.success(res, { valid: false, reason: 'Coupon is inactive' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return api.success(res, { valid: false, reason: 'Coupon has expired' });
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return api.success(res, { valid: false, reason: 'Coupon usage limit reached' });
    }

    if (amount < parseFloat(coupon.min_order_amount)) {
      return api.success(res, {
        valid:  false,
        reason: `Minimum order amount is ${coupon.min_order_amount}`,
      });
    }

    // Calculate discount
    let discountAmount;

    if (coupon.discount_type === 'percentage') {
      discountAmount = amount * (parseFloat(coupon.discount_value) / 100);
    } else {
      discountAmount = Math.min(parseFloat(coupon.discount_value), amount);
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return api.success(res, {
      valid:           true,
      code:            coupon.code,
      discount_type:   coupon.discount_type,
      discount_value:  parseFloat(coupon.discount_value),
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      final_amount:    parseFloat(finalAmount.toFixed(2)),
    });
  } catch (err) {
    console.error('[validateCoupon]', err);
    return api.error(res, 'Failed to validate coupon', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons  (admin)
// ---------------------------------------------------------------------------
export async function createCoupon(req, res) {
  const {
    code, discount_type, discount_value,
    min_order_amount, max_uses, expires_at,
  } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return api.error(res, 'code, discount_type and discount_value are required');
  }

  const validTypes = ['percentage', 'fixed'];
  if (!validTypes.includes(discount_type)) {
    return api.error(res, `discount_type must be one of: ${validTypes.join(', ')}`);
  }

  if (parseFloat(discount_value) <= 0) {
    return api.error(res, 'discount_value must be greater than 0');
  }

  if (discount_type === 'percentage' && parseFloat(discount_value) > 100) {
    return api.error(res, 'Percentage discount cannot exceed 100');
  }

  try {
    const result = await query(
      `INSERT INTO coupons
         (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
       VALUES ($1, $2::discount_type, $3, $4, $5, $6)
       RETURNING *`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        min_order_amount ?? 0,
        max_uses ?? null,
        expires_at ?? null,
      ],
    );

    return api.created(res, result.rows[0], 'Coupon created');
  } catch (err) {
    if (err.code === '23505') {
      return api.error(res, 'A coupon with this code already exists', 409);
    }
    console.error('[createCoupon]', err);
    return api.error(res, 'Failed to create coupon', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/coupons/:id  (admin)
// ---------------------------------------------------------------------------
export async function updateCoupon(req, res) {
  const { id } = req.params;
  const {
    code, discount_type, discount_value,
    min_order_amount, max_uses, expires_at, is_active,
  } = req.body;

  try {
    const existing = await query(`SELECT id FROM coupons WHERE id = $1`, [id]);

    if (existing.rowCount === 0) {
      return api.notFound(res, 'Coupon not found');
    }

    const result = await query(
      `UPDATE coupons
       SET    code             = COALESCE($1, code),
              discount_type    = COALESCE($2::discount_type, discount_type),
              discount_value   = COALESCE($3, discount_value),
              min_order_amount = COALESCE($4, min_order_amount),
              max_uses         = COALESCE($5, max_uses),
              expires_at       = COALESCE($6, expires_at),
              is_active        = COALESCE($7, is_active)
       WHERE  id = $8
       RETURNING *`,
      [
        code ? code.toUpperCase() : null,
        discount_type ?? null,
        discount_value ?? null,
        min_order_amount ?? null,
        max_uses ?? null,
        expires_at ?? null,
        is_active ?? null,
        id,
      ],
    );

    return api.success(res, result.rows[0], 'Coupon updated');
  } catch (err) {
    if (err.code === '23505') {
      return api.error(res, 'A coupon with this code already exists', 409);
    }
    console.error('[updateCoupon]', err);
    return api.error(res, 'Failed to update coupon', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/coupons/:id/deactivate  (admin)
// ---------------------------------------------------------------------------
export async function deactivateCoupon(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE coupons SET is_active = FALSE WHERE id = $1 RETURNING id, code, is_active`,
      [id],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Coupon not found');
    }

    return api.success(res, result.rows[0], 'Coupon deactivated');
  } catch (err) {
    console.error('[deactivateCoupon]', err);
    return api.error(res, 'Failed to deactivate coupon', 500);
  }
}
