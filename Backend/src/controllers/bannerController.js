import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// GET /api/banners?position=hero
export async function getBanners(req, res) {
  const { position } = req.query;
  try {
    const conditions = ['is_active = TRUE'];
    const params = [];
    if (position) { params.push(position); conditions.push(`position = $${params.length}`); }
    // Only show within date window if dates are set
    conditions.push(`(starts_at IS NULL OR starts_at <= NOW())`);
    conditions.push(`(ends_at IS NULL OR ends_at >= NOW())`);

    const { rows } = await query(
      `SELECT * FROM banners WHERE ${conditions.join(' AND ')} ORDER BY display_order ASC`,
      params,
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getBanners]', err);
    return api.error(res, 'Failed to fetch banners', 500);
  }
}

// GET /api/banners/all  (admin — includes inactive)
export async function getAllBanners(req, res) {
  try {
    const { rows } = await query(`SELECT * FROM banners ORDER BY display_order ASC, created_at DESC`);
    return api.success(res, rows);
  } catch (err) {
    console.error('[getAllBanners]', err);
    return api.error(res, 'Failed to fetch banners', 500);
  }
}

// POST /api/banners  (admin)
export async function createBanner(req, res) {
  const { title, subtitle, cta_text, cta_url, image_url, position, display_order, starts_at, ends_at } = req.body;
  if (!title?.trim() || !image_url?.trim()) return api.error(res, 'title and image_url are required', 400);

  try {
    const { rows } = await query(
      `INSERT INTO banners (title, subtitle, cta_text, cta_url, image_url, position, display_order, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [title, subtitle ?? null, cta_text ?? null, cta_url ?? null, image_url, position ?? 'hero', display_order ?? 0, starts_at ?? null, ends_at ?? null],
    );
    return api.created(res, rows[0], 'Banner created');
  } catch (err) {
    console.error('[createBanner]', err);
    return api.error(res, 'Failed to create banner', 500);
  }
}

// PUT /api/banners/:id  (admin)
export async function updateBanner(req, res) {
  const { id } = req.params;
  const { title, subtitle, cta_text, cta_url, image_url, position, display_order, is_active, starts_at, ends_at } = req.body;

  try {
    const { rows } = await query(
      `UPDATE banners
       SET    title         = COALESCE($1,  title),
              subtitle      = COALESCE($2,  subtitle),
              cta_text      = COALESCE($3,  cta_text),
              cta_url       = COALESCE($4,  cta_url),
              image_url     = COALESCE($5,  image_url),
              position      = COALESCE($6,  position),
              display_order = COALESCE($7,  display_order),
              is_active     = COALESCE($8,  is_active),
              starts_at     = COALESCE($9,  starts_at),
              ends_at       = COALESCE($10, ends_at)
       WHERE  id = $11
       RETURNING *`,
      [title ?? null, subtitle ?? null, cta_text ?? null, cta_url ?? null, image_url ?? null, position ?? null, display_order ?? null, is_active ?? null, starts_at ?? null, ends_at ?? null, id],
    );
    if (!rows.length) return api.notFound(res, 'Banner not found');
    return api.success(res, rows[0], 'Banner updated');
  } catch (err) {
    console.error('[updateBanner]', err);
    return api.error(res, 'Failed to update banner', 500);
  }
}

// DELETE /api/banners/:id  (admin)
export async function deleteBanner(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await query(`DELETE FROM banners WHERE id = $1`, [id]);
    if (!rowCount) return api.notFound(res, 'Banner not found');
    return api.success(res, null, 'Banner deleted');
  } catch (err) {
    console.error('[deleteBanner]', err);
    return api.error(res, 'Failed to delete banner', 500);
  }
}
