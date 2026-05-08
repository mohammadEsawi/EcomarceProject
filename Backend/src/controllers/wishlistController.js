import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/wishlist
// ---------------------------------------------------------------------------
export async function getWishlist(req, res) {
  const userId = req.user.id;

  try {
    const { rows } = await query(
      `SELECT w.id        AS wishlist_id,
              w.created_at AS added_at,
              p.id         AS product_id,
              p.name,
              p.price,
              p.discount_price,
              p.main_image_url AS main_image,
              p.status
       FROM   wishlist w
       JOIN   products p ON p.id = w.product_id
       WHERE  w.user_id = $1
       ORDER  BY w.created_at DESC`,
      [userId],
    );

    return api.success(res, { items: rows, count: rows.length });
  } catch (err) {
    console.error('[getWishlist]', err);
    return api.error(res, 'Failed to fetch wishlist', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/wishlist/toggle
// ---------------------------------------------------------------------------
export async function toggleWishlist(req, res) {
  const userId    = req.user.id;
  const { product_id } = req.body;

  if (!product_id) {
    return api.error(res, 'product_id is required');
  }

  try {
    // Check product exists
    const productRes = await query(
      `SELECT id FROM products WHERE id = $1 AND is_visible = TRUE`,
      [product_id],
    );

    if (productRes.rowCount === 0) {
      return api.notFound(res, 'Product not found');
    }

    // Check if already in wishlist
    const existRes = await query(
      `SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2`,
      [userId, product_id],
    );

    let action;

    if (existRes.rowCount > 0) {
      // Remove
      await query(
        `DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2`,
        [userId, product_id],
      );
      action = 'removed';
    } else {
      // Add
      await query(
        `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)`,
        [userId, product_id],
      );
      action = 'added';
    }

    const countRes = await query(
      `SELECT COUNT(*)::INT AS count FROM wishlist WHERE user_id = $1`,
      [userId],
    );

    return api.success(res, {
      action,
      product_id,
      wishlist_count: countRes.rows[0].count,
    });
  } catch (err) {
    console.error('[toggleWishlist]', err);
    return api.error(res, 'Failed to update wishlist', 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/wishlist/:productId
// ---------------------------------------------------------------------------
export async function removeFromWishlist(req, res) {
  const userId    = req.user.id;
  const { productId } = req.params;

  try {
    const result = await query(
      `DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id`,
      [userId, productId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Item not found in wishlist');
    }

    return api.success(res, null, 'Item removed from wishlist');
  } catch (err) {
    console.error('[removeFromWishlist]', err);
    return api.error(res, 'Failed to remove item from wishlist', 500);
  }
}
