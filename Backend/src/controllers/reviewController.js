import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/reviews/product/:productId
// ---------------------------------------------------------------------------
export async function getProductReviews(req, res) {
  const { productId } = req.params;

  try {
    const { rows } = await query(
      `SELECT r.id,
              r.rating,
              r.title,
              r.body,
              r.helpful_count,
              r.created_at,
              u.name AS user_name
       FROM   reviews r
       LEFT   JOIN users u ON u.id = r.user_id
       WHERE  r.product_id = $1
         AND  r.is_visible = TRUE
       ORDER  BY r.created_at DESC`,
      [productId],
    );

    const avgRes = await query(
      `SELECT ROUND(AVG(rating)::NUMERIC, 2) AS average_rating,
              COUNT(*)::INT                  AS review_count
       FROM   reviews
       WHERE  product_id = $1
         AND  is_visible = TRUE`,
      [productId],
    );

    return api.success(res, {
      reviews:        rows,
      average_rating: parseFloat(avgRes.rows[0].average_rating ?? 0),
      review_count:   avgRes.rows[0].review_count,
    });
  } catch (err) {
    console.error('[getProductReviews]', err);
    return api.error(res, 'Failed to fetch reviews', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/reviews/product/:productId
// ---------------------------------------------------------------------------
export async function createReview(req, res) {
  const userId    = req.user.id;
  const { productId } = req.params;
  const { rating, title, body } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return api.error(res, 'rating must be between 1 and 5');
  }

  try {
    // Check product exists
    const productRes = await query(
      `SELECT id FROM products WHERE id = $1 AND is_visible = TRUE`,
      [productId],
    );

    if (productRes.rowCount === 0) {
      return api.notFound(res, 'Product not found');
    }

    // Prevent duplicate reviews
    const dupRes = await query(
      `SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2`,
      [productId, userId],
    );

    if (dupRes.rowCount > 0) {
      return api.error(res, 'You have already reviewed this product', 409);
    }

    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, title, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [productId, userId, rating, title ?? null, body ?? null],
    );

    return api.created(res, result.rows[0], 'Review submitted');
  } catch (err) {
    console.error('[createReview]', err);
    return api.error(res, 'Failed to create review', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/reviews/:id
// ---------------------------------------------------------------------------
export async function updateReview(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;
  const { rating, title, body } = req.body;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return api.error(res, 'rating must be between 1 and 5');
  }

  try {
    const reviewRes = await query(
      `SELECT id, user_id FROM reviews WHERE id = $1`,
      [id],
    );

    if (reviewRes.rowCount === 0) {
      return api.notFound(res, 'Review not found');
    }

    if (String(reviewRes.rows[0].user_id) !== String(userId)) {
      return api.forbidden(res, 'You can only edit your own reviews');
    }

    const result = await query(
      `UPDATE reviews
       SET    rating     = COALESCE($1, rating),
              title      = COALESCE($2, title),
              body       = COALESCE($3, body),
              updated_at = NOW()
       WHERE  id = $4
       RETURNING *`,
      [rating ?? null, title ?? null, body ?? null, id],
    );

    return api.success(res, result.rows[0], 'Review updated');
  } catch (err) {
    console.error('[updateReview]', err);
    return api.error(res, 'Failed to update review', 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/reviews/:id
// ---------------------------------------------------------------------------
export async function deleteReview(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    const reviewRes = await query(
      `SELECT id, user_id FROM reviews WHERE id = $1`,
      [id],
    );

    if (reviewRes.rowCount === 0) {
      return api.notFound(res, 'Review not found');
    }

    const isOwner = String(reviewRes.rows[0].user_id) === String(userId);

    if (!isOwner && !isAdmin) {
      return api.forbidden(res, 'You are not allowed to delete this review');
    }

    await query(`DELETE FROM reviews WHERE id = $1`, [id]);

    return api.success(res, null, 'Review deleted');
  } catch (err) {
    console.error('[deleteReview]', err);
    return api.error(res, 'Failed to delete review', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/reviews/:id/helpful
// ---------------------------------------------------------------------------
export async function markHelpful(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE reviews
       SET    helpful_count = helpful_count + 1
       WHERE  id = $1 AND is_visible = TRUE
       RETURNING id, helpful_count`,
      [id],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Review not found');
    }

    return api.success(res, result.rows[0], 'Marked as helpful');
  } catch (err) {
    console.error('[markHelpful]', err);
    return api.error(res, 'Failed to mark review as helpful', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/reviews/:id/hide  (admin)
// ---------------------------------------------------------------------------
export async function hideReview(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE reviews
       SET    is_visible = FALSE,
              updated_at = NOW()
       WHERE  id = $1
       RETURNING id, is_visible, updated_at`,
      [id],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Review not found');
    }

    return api.success(res, result.rows[0], 'Review hidden');
  } catch (err) {
    console.error('[hideReview]', err);
    return api.error(res, 'Failed to hide review', 500);
  }
}
