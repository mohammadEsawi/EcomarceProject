import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// GET /api/brands
export async function getBrands(req, res) {
  try {
    const { rows } = await query(
      `SELECT b.*, COUNT(p.id)::INT AS product_count
       FROM   brands b
       LEFT   JOIN products p ON p.brand_id = b.id AND p.is_visible = TRUE
       WHERE  b.is_active = TRUE
       GROUP  BY b.id
       ORDER  BY b.name`,
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getBrands]', err);
    return api.error(res, 'Failed to fetch brands', 500);
  }
}

// GET /api/brands/:id
export async function getBrand(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `SELECT b.*, COUNT(p.id)::INT AS product_count
       FROM   brands b
       LEFT   JOIN products p ON p.brand_id = b.id AND p.is_visible = TRUE
       WHERE  b.id = $1
       GROUP  BY b.id`,
      [id],
    );
    if (!rows.length) return api.notFound(res, 'Brand not found');
    return api.success(res, rows[0]);
  } catch (err) {
    console.error('[getBrand]', err);
    return api.error(res, 'Failed to fetch brand', 500);
  }
}

// POST /api/brands  (admin)
export async function createBrand(req, res) {
  const { name, description, logo_url, website_url } = req.body;
  if (!name?.trim()) return api.error(res, 'Brand name is required', 400);

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    const { rows } = await query(
      `INSERT INTO brands (name, slug, description, logo_url, website_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), slug, description ?? null, logo_url ?? null, website_url ?? null],
    );
    return api.created(res, rows[0], 'Brand created');
  } catch (err) {
    if (err.code === '23505') return api.error(res, 'Brand name already exists', 409);
    console.error('[createBrand]', err);
    return api.error(res, 'Failed to create brand', 500);
  }
}

// PUT /api/brands/:id  (admin)
export async function updateBrand(req, res) {
  const { id } = req.params;
  const { name, description, logo_url, website_url, is_active } = req.body;

  try {
    const { rows } = await query(
      `UPDATE brands
       SET    name        = COALESCE($1, name),
              description = COALESCE($2, description),
              logo_url    = COALESCE($3, logo_url),
              website_url = COALESCE($4, website_url),
              is_active   = COALESCE($5, is_active)
       WHERE  id = $6
       RETURNING *`,
      [name ?? null, description ?? null, logo_url ?? null, website_url ?? null, is_active ?? null, id],
    );
    if (!rows.length) return api.notFound(res, 'Brand not found');
    return api.success(res, rows[0], 'Brand updated');
  } catch (err) {
    if (err.code === '23505') return api.error(res, 'Brand name already exists', 409);
    console.error('[updateBrand]', err);
    return api.error(res, 'Failed to update brand', 500);
  }
}

// DELETE /api/brands/:id  (admin)
export async function deleteBrand(req, res) {
  const { id } = req.params;
  try {
    // Unlink products from brand first
    await query(`UPDATE products SET brand_id = NULL WHERE brand_id = $1`, [id]);
    const { rowCount } = await query(`DELETE FROM brands WHERE id = $1`, [id]);
    if (!rowCount) return api.notFound(res, 'Brand not found');
    return api.success(res, null, 'Brand deleted');
  } catch (err) {
    console.error('[deleteBrand]', err);
    return api.error(res, 'Failed to delete brand', 500);
  }
}
