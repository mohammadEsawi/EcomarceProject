import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/inventory/alerts  (admin)
// ---------------------------------------------------------------------------
export async function getStockAlerts(req, res) {
  try {
    const { rows } = await query(
      `SELECT sa.id,
              sa.alert_type,
              sa.is_resolved,
              sa.created_at,
              p.id   AS product_id,
              p.name AS product_name,
              c.name AS color_name,
              s.name AS size_name,
              i.quantity AS current_quantity
       FROM   stock_alerts      sa
       JOIN   product_variants  pv ON pv.id = sa.variant_id
       JOIN   products          p  ON p.id  = pv.product_id
       JOIN   colors            c  ON c.id  = pv.color_id
       JOIN   sizes             s  ON s.id  = pv.size_id
       JOIN   inventory         i  ON i.variant_id = sa.variant_id
       WHERE  sa.is_resolved = FALSE
       ORDER  BY sa.created_at DESC`,
    );

    return api.success(res, rows);
  } catch (err) {
    console.error('[getStockAlerts]', err);
    return api.error(res, 'Failed to fetch stock alerts', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inventory/alerts/:id/resolve  (admin)
// ---------------------------------------------------------------------------
export async function resolveAlert(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE stock_alerts
       SET    is_resolved = TRUE
       WHERE  id = $1
       RETURNING *`,
      [id],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Stock alert not found');
    }

    return api.success(res, result.rows[0], 'Alert resolved');
  } catch (err) {
    console.error('[resolveAlert]', err);
    return api.error(res, 'Failed to resolve alert', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/inventory/report  (admin)
// ---------------------------------------------------------------------------
export async function getInventoryReport(req, res) {
  try {
    // Per-product summary
    const summaryRes = await query(
      `SELECT p.id                        AS product_id,
              p.name                      AS product_name,
              p.status                    AS product_status,
              SUM(i.quantity)::INT        AS total_stock,
              COUNT(pv.id)::INT           AS total_variants,
              COUNT(CASE WHEN i.quantity = 0                         THEN 1 END)::INT AS out_of_stock_variants,
              COUNT(CASE WHEN i.quantity > 0
                          AND i.quantity <= i.low_stock_threshold    THEN 1 END)::INT AS low_stock_variants
       FROM   products         p
       JOIN   product_variants pv ON pv.product_id = p.id
       JOIN   inventory        i  ON i.variant_id  = pv.id
       GROUP  BY p.id, p.name, p.status
       ORDER  BY p.name`,
    );

    // Per-variant detail
    const variantRes = await query(
      `SELECT pv.id        AS variant_id,
              p.id         AS product_id,
              p.name       AS product_name,
              c.name       AS color_name,
              s.name       AS size_name,
              pv.sku,
              i.quantity,
              i.low_stock_threshold,
              i.updated_at AS last_updated
       FROM   product_variants pv
       JOIN   products         p  ON p.id  = pv.product_id
       JOIN   colors           c  ON c.id  = pv.color_id
       JOIN   sizes            s  ON s.id  = pv.size_id
       JOIN   inventory        i  ON i.variant_id = pv.id
       ORDER  BY p.name, c.name, s.display_order`,
    );

    return api.success(res, {
      products: summaryRes.rows,
      variants: variantRes.rows,
    });
  } catch (err) {
    console.error('[getInventoryReport]', err);
    return api.error(res, 'Failed to fetch inventory report', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inventory/:variantId  (admin)
// ---------------------------------------------------------------------------
export async function updateStock(req, res) {
  const { variantId } = req.params;
  const { quantity }  = req.body;

  if (quantity === undefined || quantity === null) {
    return api.error(res, 'quantity is required');
  }

  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty < 0) {
    return api.error(res, 'quantity must be a non-negative integer');
  }

  try {
    const result = await query(
      `UPDATE inventory
       SET    quantity   = $1,
              updated_at = NOW()
       WHERE  variant_id = $2
       RETURNING *`,
      [qty, variantId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Inventory record not found for this variant');
    }

    // Return enriched stock info
    const infoRes = await query(
      `SELECT i.*,
              p.name  AS product_name,
              c.name  AS color_name,
              s.name  AS size_name,
              pv.sku
       FROM   inventory        i
       JOIN   product_variants pv ON pv.id = i.variant_id
       JOIN   products         p  ON p.id  = pv.product_id
       JOIN   colors           c  ON c.id  = pv.color_id
       JOIN   sizes            s  ON s.id  = pv.size_id
       WHERE  i.variant_id = $1`,
      [variantId],
    );

    return api.success(res, infoRes.rows[0], 'Stock updated');
  } catch (err) {
    console.error('[updateStock]', err);
    return api.error(res, 'Failed to update stock', 500);
  }
}
