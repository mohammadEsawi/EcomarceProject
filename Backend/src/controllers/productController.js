/**
 * Product controller.
 *
 * All queries are fully parameterized – user-controlled values NEVER appear via
 * string interpolation.  The only dynamic SQL construction used here is for the
 * ORDER BY clause (validated against a hard-coded allow-list) and the WHERE
 * clause column list (built by pushing to an array, never from user input).
 */

import { query, withTransaction } from '../config/database.js';
import * as respond from '../utils/apiResponse.js';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Turn a product name into a URL-friendly slug.
 * e.g. "Classic White T-Shirt" → "classic-white-t-shirt"
 */
function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure uniqueness of a generated slug inside the products table.
 * Appends -2, -3 … until the slug is free.
 */
async function uniqueSlug(base, excludeId = null) {
  let candidate = base;
  let suffix = 1;

  while (true) {
    const params = [candidate];
    let sql = 'SELECT id FROM products WHERE slug = $1';

    if (excludeId) {
      sql += ' AND id <> $2';
      params.push(excludeId);
    }

    const { rowCount } = await query(sql, params);
    if (rowCount === 0) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

/** Clamp an integer to [min, max]. */
function clamp(value, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

// ─── getProducts ─────────────────────────────────────────────────────────────

/**
 * GET /api/products
 *
 * Query params (all optional):
 *   search, category_id, min_price, max_price, size_id, color_id,
 *   in_stock (true|false), featured (true|false),
 *   sort (price_asc | price_desc | newest | popular),
 *   page (default 1), limit (default 20, max 100)
 */
export async function getProducts(req, res, next) {
  try {
    const {
      search,
      category_id,
      min_price,
      max_price,
      sizes,      // comma-separated size names e.g. "S,M,XL"
      in_stock,
      featured,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query ?? {};

    const pageNum = clamp(page, 1, 10_000);
    const limitNum = clamp(limit, 1, 100);
    const offset = (pageNum - 1) * limitNum;

    // ── dynamic WHERE clause (params array grows as filters are added) ────────
    const params = [];
    const conditions = ['p.is_visible = TRUE'];

    const push = (val) => {
      params.push(val);
      return `$${params.length}`;
    };

    if (search?.trim()) {
      conditions.push(
        `(p.name ILIKE ${push('%' + search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_') + '%')} OR p.description ILIKE ${push('%' + search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_') + '%')})`,
      );
    }

    if (category_id) {
      conditions.push(`p.category_id = ${push(parseInt(category_id, 10))}`);
    }

    if (min_price !== undefined && min_price !== '') {
      const minVal = parseFloat(min_price);
      if (!Number.isNaN(minVal)) {
        conditions.push(`COALESCE(p.discount_price, p.price) >= ${push(minVal)}`);
      }
    }

    if (max_price !== undefined && max_price !== '') {
      const maxVal = parseFloat(max_price);
      if (!Number.isNaN(maxVal)) {
        conditions.push(`COALESCE(p.discount_price, p.price) <= ${push(maxVal)}`);
      }
    }

    if (sizes?.trim()) {
      const sizeNames = sizes.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      if (sizeNames.length) {
        conditions.push(
          `EXISTS (
             SELECT 1
               FROM product_variants pv
               JOIN sizes s ON s.id = pv.size_id
              WHERE pv.product_id = p.id
                AND UPPER(s.name) = ANY(${push(sizeNames)})
           )`,
        );
      }
    }

    if (in_stock === 'true') {
      conditions.push(
        `EXISTS (
           SELECT 1
             FROM product_variants pv
             JOIN inventory inv ON inv.variant_id = pv.id
            WHERE pv.product_id = p.id
              AND TRUE
              AND inv.quantity  > 0
         )`,
      );
    }

    if (featured === 'true') {
      conditions.push('p.is_featured = TRUE');
    }

    // ── ORDER BY (allow-listed – never from raw user input) ──────────────────
    const ORDER_MAP = {
      price_asc:  'COALESCE(p.discount_price, p.price) ASC',
      price_desc: 'COALESCE(p.discount_price, p.price) DESC',
      newest:     'p.created_at DESC',
      popular:    'review_count DESC, average_rating DESC',
    };
    const orderBy = ORDER_MAP[sort] ?? ORDER_MAP.newest;

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // ── main query ────────────────────────────────────────────────────────────
    const dataSql = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.price,
        p.discount_price,
        p.status,
        p.is_featured,
        p.created_at,
        c.id   AS category_id,
        c.name AS category_name,
        p.main_image_url,
        COALESCE(inv_agg.total_stock, 0)        AS total_stock,
        COALESCE(rev_agg.average_rating, 0)::NUMERIC(3,2) AS average_rating,
        COALESCE(rev_agg.review_count, 0)       AS review_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN (
        SELECT pv.product_id, SUM(inv.quantity) AS total_stock
          FROM product_variants pv
          JOIN inventory inv ON inv.variant_id = pv.id
         WHERE TRUE
         GROUP BY pv.product_id
      ) inv_agg ON inv_agg.product_id = p.id
      LEFT JOIN (
        SELECT product_id,
               ROUND(AVG(rating), 2) AS average_rating,
               COUNT(*)              AS review_count
          FROM reviews
         WHERE is_visible = TRUE
         GROUP BY product_id
      ) rev_agg ON rev_agg.product_id = p.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${push(limitNum)} OFFSET ${push(offset)}
    `;

    // ── count query (re-uses same params minus the pagination ones) ───────────
    const countParams = params.slice(0, params.length - 2);
    const countSql = `
      SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(dataSql, params),
      query(countSql, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    return respond.success(res, {
      products: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ─── getProduct ───────────────────────────────────────────────────────────────

/**
 * GET /api/products/:id
 * Returns full product detail including images, variants grouped by color,
 * sizes per color, aggregate inventory, and review summary.
 */
export async function getProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return respond.error(res, 'Invalid product id', 400);
    }

    // ── core product row ──────────────────────────────────────────────────────
    const productResult = await query(
      `SELECT
         p.*,
         c.id   AS category_id,
         c.name AS category_name,
         c.slug AS category_slug,
         COALESCE(inv_agg.total_stock, 0)               AS total_stock,
         COALESCE(rev_agg.average_rating, 0)::NUMERIC(3,2) AS average_rating,
         COALESCE(rev_agg.review_count, 0)              AS review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT pv.product_id, SUM(inv.quantity) AS total_stock
           FROM product_variants pv
           JOIN inventory inv ON inv.variant_id = pv.id
          WHERE TRUE
          GROUP BY pv.product_id
       ) inv_agg ON inv_agg.product_id = p.id
       LEFT JOIN (
         SELECT product_id,
                ROUND(AVG(rating), 2) AS average_rating,
                COUNT(*)              AS review_count
           FROM reviews
          WHERE is_visible = TRUE
          GROUP BY product_id
       ) rev_agg ON rev_agg.product_id = p.id
       WHERE p.id = $1`,
      [productId],
    );

    if (productResult.rowCount === 0) {
      return respond.notFound(res, 'Product not found');
    }

    const product = productResult.rows[0];

    // ── images ────────────────────────────────────────────────────────────────
    const imagesResult = await query(
      `SELECT id, image_url, display_order, is_main
         FROM product_images
        WHERE product_id = $1
        ORDER BY display_order ASC, id ASC`,
      [productId],
    );

    // ── variants (sizes + stock) ──────────────────────────────────────────────
    const variantsResult = await query(
      `SELECT
         s.id              AS size_id,
         s.name            AS size_name,
         s.display_order   AS size_display_order,
         pv.id             AS variant_id,
         COALESCE(inv.quantity, 0) AS stock_quantity
       FROM product_variants pv
       JOIN sizes  s    ON s.id   = pv.size_id
       LEFT JOIN inventory inv ON inv.variant_id = pv.id
       WHERE pv.product_id = $1
       ORDER BY s.display_order ASC, s.name ASC`,
      [productId],
    );

    const sizes = variantsResult.rows.map((row) => ({
      size_id:        row.size_id,
      size_name:      row.size_name,
      variant_id:     row.variant_id,
      stock_quantity: parseInt(row.stock_quantity, 10),
    }));

    // Strip internal DB columns from the product row before returning
    delete product.password_hash; // guard – should never exist, but be safe

    return respond.success(res, {
      product: {
        ...product,
        images: imagesResult.rows,
        sizes,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ─── createProduct ────────────────────────────────────────────────────────────

/**
 * POST /api/products  (admin only)
 * Body: { name, description, price, discount_price?, category_id, is_featured?, is_visible? }
 */
export async function createProduct(req, res, next) {
  try {
    const {
      name,
      description,
      price,
      discount_price = null,
      category_id,
      is_featured = false,
      is_visible = true,
    } = req.body ?? {};

    if (!name || price === undefined || price === null || !category_id) {
      return respond.error(res, 'name, price and category_id are required', 400);
    }

    const numPrice = parseFloat(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return respond.error(res, 'price must be a non-negative number', 400);
    }

    const numDiscountPrice =
      discount_price !== null && discount_price !== '' ? parseFloat(discount_price) : null;

    if (numDiscountPrice !== null && (Number.isNaN(numDiscountPrice) || numDiscountPrice < 0)) {
      return respond.error(res, 'discount_price must be a non-negative number', 400);
    }

    const slug = await uniqueSlug(slugify(name));

    const result = await query(
      `INSERT INTO products
         (name, slug, description, price, discount_price, category_id,
          is_featured, is_visible, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available', NOW(), NOW())
       RETURNING *`,
      [
        String(name).trim(),
        slug,
        description ? String(description).trim() : null,
        numPrice,
        numDiscountPrice,
        parseInt(category_id, 10),
        Boolean(is_featured),
        Boolean(is_visible),
      ],
    );

    return respond.created(res, { product: result.rows[0] }, 'Product created successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── updateProduct ────────────────────────────────────────────────────────────

/**
 * PUT /api/products/:id  (admin only)
 * Accepts any subset of: name, description, price, discount_price,
 *                        category_id, is_featured, is_visible, status
 */
export async function updateProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return respond.error(res, 'Invalid product id', 400);
    }

    // Verify the product exists
    const existing = await query('SELECT id, name FROM products WHERE id = $1', [productId]);
    if (existing.rowCount === 0) {
      return respond.notFound(res, 'Product not found');
    }

    const allowedFields = [
      'name', 'description', 'price', 'discount_price',
      'category_id', 'is_featured', 'is_visible', 'status',
    ];

    const setClauses = [];
    const params = [];

    const push = (val) => {
      params.push(val);
      return `$${params.length}`;
    };

    for (const field of allowedFields) {
      if (req.body[field] === undefined) continue;

      let value = req.body[field];

      if (field === 'price' || field === 'discount_price') {
        value = value === null || value === '' ? null : parseFloat(value);
        if (value !== null && Number.isNaN(value)) {
          return respond.error(res, `${field} must be a number`, 400);
        }
      }

      if (field === 'category_id') {
        value = parseInt(value, 10);
      }

      if (field === 'name') {
        value = String(value).trim();
        // Regenerate slug when name changes
        const newSlug = await uniqueSlug(slugify(value), productId);
        setClauses.push(`slug = ${push(newSlug)}`);
      }

      setClauses.push(`${field} = ${push(value)}`);
    }

    if (setClauses.length === 0) {
      return respond.error(res, 'No valid fields provided for update', 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(productId);

    const result = await query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    return respond.success(res, { product: result.rows[0] }, 'Product updated successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── deleteProduct ────────────────────────────────────────────────────────────

/**
 * DELETE /api/products/:id  (admin only)
 * Relies on ON DELETE CASCADE in the schema for images, variants, and inventory.
 */
export async function deleteProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return respond.error(res, 'Invalid product id', 400);
    }

    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [productId],
    );

    if (result.rowCount === 0) {
      return respond.notFound(res, 'Product not found');
    }

    return respond.success(res, { deleted: result.rows[0] }, 'Product deleted successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── uploadProductImages ──────────────────────────────────────────────────────

/**
 * POST /api/products/:id/images  (admin only)
 * Expects files uploaded via multer (field name "images").
 * Body field: is_main (boolean, optional) – forces the first uploaded image as main.
 */
export async function uploadProductImages(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return respond.error(res, 'Invalid product id', 400);
    }

    if (!req.files || req.files.length === 0) {
      return respond.error(res, 'No image files were uploaded', 400);
    }

    // Check product exists
    const existing = await query(
      'SELECT id, main_image_url FROM products WHERE id = $1',
      [productId],
    );
    if (existing.rowCount === 0) {
      return respond.notFound(res, 'Product not found');
    }

    const isFirstUpload = existing.rows[0].main_image_url === null;
    const forceMain = req.body?.is_main === 'true' || req.body?.is_main === true;

    // Determine current max display_order
    const orderResult = await query(
      'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM product_images WHERE product_id = $1',
      [productId],
    );
    let displayOrder = parseInt(orderResult.rows[0].max_order, 10) + 1;

    const insertedImages = await withTransaction(async (client) => {
      const results = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // Build a server-relative URL; adjust the path prefix to match your static serving setup.
        const imageUrl = `/uploads/${file.filename}`;
        const isMain = i === 0 && (isFirstUpload || forceMain);

        const { rows } = await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order, is_main, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING *`,
          [productId, imageUrl, displayOrder, isMain],
        );

        results.push(rows[0]);

        if (isMain) {
          await client.query(
            'UPDATE products SET main_image_url = $1, updated_at = NOW() WHERE id = $2',
            [imageUrl, productId],
          );
          // Unset is_main on any previous main image
          await client.query(
            `UPDATE product_images
                SET is_main = FALSE
              WHERE product_id = $1
                AND id <> $2
                AND is_main = TRUE`,
            [productId, rows[0].id],
          );
        }

        displayOrder++;
      }

      return results;
    });

    return respond.created(res, { images: insertedImages }, 'Images uploaded successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── addProductVariant ────────────────────────────────────────────────────────

/**
 * POST /api/products/:id/variants  (admin only)
 * Body: { color_id, size_id, initial_quantity }
 */
export async function addProductVariant(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) {
      return respond.error(res, 'Invalid product id', 400);
    }

    const { color_id, size_id, initial_quantity = 0 } = req.body ?? {};

    if (!color_id || !size_id) {
      return respond.error(res, 'color_id and size_id are required', 400);
    }

    const numColorId = parseInt(color_id, 10);
    const numSizeId  = parseInt(size_id, 10);
    const numQty     = Math.max(0, parseInt(initial_quantity, 10) || 0);

    // Check product exists
    const productCheck = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rowCount === 0) {
      return respond.notFound(res, 'Product not found');
    }

    // Prevent duplicate variant (product + color + size combination)
    const dupCheck = await query(
      `SELECT id FROM product_variants
        WHERE product_id = $1 AND color_id = $2 AND size_id = $3`,
      [productId, numColorId, numSizeId],
    );
    if (dupCheck.rowCount > 0) {
      return respond.error(
        res,
        'A variant with this color and size already exists for this product',
        409,
      );
    }

    const result = await withTransaction(async (client) => {
      // Insert the variant
      const { rows: variantRows } = await client.query(
        `INSERT INTO product_variants (product_id, color_id, size_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [productId, numColorId, numSizeId],
      );

      const variant = variantRows[0];

      // Insert initial inventory record
      const { rows: invRows } = await client.query(
        `INSERT INTO inventory (variant_id, quantity, updated_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [variant.id, numQty],
      );

      return { variant, inventory: invRows[0] };
    });

    return respond.created(res, result, 'Product variant added successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── updateInventory ──────────────────────────────────────────────────────────

/**
 * PATCH /api/products/inventory/:variant_id  (admin only)
 * Body: { quantity }
 *
 * Updates the inventory row for the given variant.
 * A DB trigger (if defined in the schema) can then update product.status
 * automatically; no application-level trigger management needed here.
 */
export async function updateInventory(req, res, next) {
  try {
    const variantId = parseInt(req.params.variant_id, 10);
    if (Number.isNaN(variantId)) {
      return respond.error(res, 'Invalid variant id', 400);
    }

    const { quantity } = req.body ?? {};

    if (quantity === undefined || quantity === null) {
      return respond.error(res, 'quantity is required', 400);
    }

    const numQty = parseInt(quantity, 10);
    if (Number.isNaN(numQty) || numQty < 0) {
      return respond.error(res, 'quantity must be a non-negative integer', 400);
    }

    // Check the variant exists
    const variantCheck = await query(
      'SELECT id FROM product_variants WHERE id = $1',
      [variantId],
    );
    if (variantCheck.rowCount === 0) {
      return respond.notFound(res, 'Product variant not found');
    }

    // Upsert: update existing row or insert if none yet
    const result = await query(
      `INSERT INTO inventory (variant_id, quantity, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (variant_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [variantId, numQty],
    );

    return respond.success(res, { inventory: result.rows[0] }, 'Inventory updated successfully');
  } catch (err) {
    return next(err);
  }
}

// ─── getProductVariants ───────────────────────────────────────────────────────

/**
 * GET /api/products/:id/variants  (admin only)
 * Returns all variants with color, size, and current stock for a product.
 */
export async function getProductVariants(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) return respond.error(res, 'Invalid product id', 400);

    const { rows } = await query(
      `SELECT
         pv.id             AS variant_id,
         s.id              AS size_id,
         s.name            AS size_name,
         s.display_order,
         COALESCE(inv.quantity, 0) AS stock
       FROM product_variants pv
       JOIN sizes  s   ON s.id   = pv.size_id
       LEFT JOIN inventory inv ON inv.variant_id = pv.id
       WHERE pv.product_id = $1
       ORDER BY s.display_order ASC, s.name ASC`,
      [productId],
    );
    return respond.success(res, { variants: rows });
  } catch (err) {
    return next(err);
  }
}

// ─── addVariantByName ─────────────────────────────────────────────────────────

/**
 * POST /api/products/:id/variants/simple  (admin only)
 * Body: { size_name, color_name, hex_code?, quantity }
 * Upserts color + size by name, then creates the variant + inventory.
 */
export async function addVariantByName(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (Number.isNaN(productId)) return respond.error(res, 'Invalid product id', 400);

    const { size_name, quantity = 0 } = req.body ?? {};
    if (!size_name) {
      return respond.error(res, 'size_name is required', 400);
    }

    const numQty = Math.max(0, parseInt(quantity, 10) || 0);

    const result = await withTransaction(async (client) => {
      // Always use the internal "Default" color (hidden from UI)
      const { rows: colorRows } = await client.query(
        `INSERT INTO colors (name, hex_code, created_at)
         VALUES ('Default', '#000000', NOW())
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
      );
      const colorId = colorRows[0].id;

      // Upsert size
      const { rows: sizeRows } = await client.query(
        `INSERT INTO sizes (name, display_order, created_at)
         VALUES ($1, 0, NOW())
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [size_name.trim().toUpperCase()],
      );
      const sizeId = sizeRows[0]?.id ?? (
        await client.query('SELECT id FROM sizes WHERE name = $1', [size_name.trim().toUpperCase()])
      ).rows[0]?.id;

      if (!sizeId) throw new Error('Failed to resolve size');

      // Check for duplicate variant
      const { rows: dupRows } = await client.query(
        `SELECT id FROM product_variants WHERE product_id=$1 AND color_id=$2 AND size_id=$3`,
        [productId, colorId, sizeId],
      );
      if (dupRows.length > 0) throw Object.assign(new Error('Size already exists for this product'), { statusCode: 409 });

      // Insert variant
      const { rows: varRows } = await client.query(
        `INSERT INTO product_variants (product_id, color_id, size_id, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [productId, colorId, sizeId],
      );
      const variant = varRows[0];

      // Upsert inventory
      await client.query(
        `INSERT INTO inventory (variant_id, quantity, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (variant_id) DO UPDATE SET quantity=$2, updated_at=NOW()`,
        [variant.id, numQty],
      );

      return {
        variant_id: variant.id,
        size_id: sizeId,
        size_name: size_name.trim().toUpperCase(),
        stock: numQty,
      };
    });

    return respond.created(res, { variant: result }, 'Variant added');
  } catch (err) {
    if (err.statusCode === 409) return respond.error(res, err.message, 409);
    return next(err);
  }
}

// ─── deleteVariant ────────────────────────────────────────────────────────────

/**
 * DELETE /api/products/variants/:variantId  (admin only)
 */
export async function deleteVariant(req, res, next) {
  try {
    const variantId = parseInt(req.params.variantId, 10);
    if (Number.isNaN(variantId)) return respond.error(res, 'Invalid variant id', 400);

    await query('DELETE FROM product_variants WHERE id = $1', [variantId]);
    return respond.success(res, null, 'Variant deleted');
  } catch (err) {
    return next(err);
  }
}

// ─── getFeaturedProducts ──────────────────────────────────────────────────────

/**
 * GET /api/products/featured
 * Returns is_featured=true, is_visible=true products with their main image.
 * Optional query param: limit (default 8, max 50)
 */
export async function getFeaturedProducts(req, res, next) {
  try {
    const limitNum = clamp(req.query.limit ?? 8, 1, 50);

    const result = await query(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.price,
         p.discount_price,
         p.main_image_url,
         p.status,
         p.is_featured,
         c.id   AS category_id,
         c.name AS category_name,
         COALESCE(rev_agg.average_rating, 0)::NUMERIC(3,2) AS average_rating,
         COALESCE(rev_agg.review_count, 0)                 AS review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT product_id,
                ROUND(AVG(rating), 2) AS average_rating,
                COUNT(*)              AS review_count
           FROM reviews
          WHERE is_visible = TRUE
          GROUP BY product_id
       ) rev_agg ON rev_agg.product_id = p.id
       WHERE p.is_featured = TRUE
         AND p.is_visible  = TRUE
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limitNum],
    );

    return respond.success(res, { products: result.rows });
  } catch (err) {
    return next(err);
  }
}

// ─── getProductsByCategory ────────────────────────────────────────────────────

/**
 * GET /api/products/category/:slug
 * Returns all visible products belonging to the category identified by slug.
 * Supports same sort/page/limit query params as getProducts.
 */
export async function getProductsByCategory(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug?.trim()) {
      return respond.error(res, 'Category slug is required', 400);
    }

    // Resolve category
    const catResult = await query(
      'SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1',
      [slug.trim().toLowerCase()],
    );

    if (catResult.rowCount === 0) {
      return respond.notFound(res, 'Category not found');
    }

    const category = catResult.rows[0];

    const { sort = 'newest', page = 1, limit = 20 } = req.query ?? {};
    const pageNum  = clamp(page, 1, 10_000);
    const limitNum = clamp(limit, 1, 100);
    const offset   = (pageNum - 1) * limitNum;

    const ORDER_MAP = {
      price_asc:  'COALESCE(p.discount_price, p.price) ASC',
      price_desc: 'COALESCE(p.discount_price, p.price) DESC',
      newest:     'p.created_at DESC',
      popular:    'review_count DESC, average_rating DESC',
    };
    const orderBy = ORDER_MAP[sort] ?? ORDER_MAP.newest;

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT
           p.id,
           p.name,
           p.slug,
           p.price,
           p.discount_price,
           p.main_image_url,
           p.status,
           p.is_featured,
           p.created_at,
           COALESCE(inv_agg.total_stock, 0)               AS total_stock,
           COALESCE(rev_agg.average_rating, 0)::NUMERIC(3,2) AS average_rating,
           COALESCE(rev_agg.review_count, 0)              AS review_count
         FROM products p
         LEFT JOIN (
           SELECT pv.product_id, SUM(inv.quantity) AS total_stock
             FROM product_variants pv
             JOIN inventory inv ON inv.variant_id = pv.id
            WHERE TRUE
            GROUP BY pv.product_id
         ) inv_agg ON inv_agg.product_id = p.id
         LEFT JOIN (
           SELECT product_id,
                  ROUND(AVG(rating), 2) AS average_rating,
                  COUNT(*)              AS review_count
             FROM reviews
            WHERE is_visible = TRUE
            GROUP BY product_id
         ) rev_agg ON rev_agg.product_id = p.id
         WHERE p.category_id = $1
           AND p.is_visible  = TRUE
         ORDER BY ${orderBy}
         LIMIT $2 OFFSET $3`,
        [category.id, limitNum, offset],
      ),
      query(
        'SELECT COUNT(*) AS total FROM products WHERE category_id = $1 AND is_visible = TRUE',
        [category.id],
      ),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    return respond.success(res, {
      category,
      products: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}
