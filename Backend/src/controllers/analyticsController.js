import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// GET /api/analytics/overview
export async function getOverview(req, res) {
  try {
    const [revenue, orders, users, products] = await Promise.all([
      query(`SELECT
               COALESCE(SUM(total_amount),0)::FLOAT            AS total_revenue,
               COALESCE(SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN total_amount END),0)::FLOAT AS month_revenue,
               COALESCE(SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()-INTERVAL '1 month') THEN total_amount END),0)::FLOAT AS prev_month_revenue
             FROM orders WHERE status NOT IN ('cancelled')`),
      query(`SELECT
               COUNT(*)::INT                                    AS total_orders,
               COUNT(CASE WHEN status='pending' THEN 1 END)::INT  AS pending_orders,
               COUNT(CASE WHEN status='processing' THEN 1 END)::INT AS processing_orders,
               COUNT(CASE WHEN status='shipped' THEN 1 END)::INT  AS shipped_orders,
               COUNT(CASE WHEN status='delivered' THEN 1 END)::INT AS delivered_orders,
               COUNT(CASE WHEN status='cancelled' THEN 1 END)::INT AS cancelled_orders,
               COUNT(CASE WHEN created_at >= NOW()-INTERVAL '7 days' THEN 1 END)::INT AS orders_7d
             FROM orders`),
      query(`SELECT
               COUNT(*)::INT                                          AS total_users,
               COUNT(CASE WHEN created_at >= NOW()-INTERVAL '30 days' THEN 1 END)::INT AS new_users_30d,
               COUNT(CASE WHEN created_at >= NOW()-INTERVAL '7 days' THEN 1 END)::INT  AS new_users_7d
             FROM users WHERE role = 'customer'`),
      query(`SELECT
               COUNT(*)::INT                                         AS total_products,
               COUNT(CASE WHEN status='out_of_stock' THEN 1 END)::INT AS out_of_stock,
               COUNT(CASE WHEN status='low_stock' THEN 1 END)::INT    AS low_stock,
               COUNT(CASE WHEN is_featured=TRUE THEN 1 END)::INT      AS featured
             FROM products WHERE is_visible = TRUE`),
    ]);

    const rev = revenue.rows[0];
    const revenueGrowth = rev.prev_month_revenue > 0
      ? ((rev.month_revenue - rev.prev_month_revenue) / rev.prev_month_revenue * 100).toFixed(1)
      : null;

    return api.success(res, {
      revenue: { ...rev, revenue_growth_pct: revenueGrowth },
      orders: orders.rows[0],
      users: users.rows[0],
      products: products.rows[0],
    });
  } catch (err) {
    console.error('[getOverview]', err);
    return api.error(res, 'Failed to fetch analytics overview', 500);
  }
}

// GET /api/analytics/sales?period=30
export async function getSalesChart(req, res) {
  const days = Math.min(365, Math.max(7, parseInt(req.query.period ?? '30', 10)));
  try {
    const { rows } = await query(
      `SELECT
         DATE_TRUNC('day', created_at)::DATE AS date,
         COUNT(*)::INT                        AS order_count,
         COALESCE(SUM(total_amount), 0)::FLOAT AS revenue
       FROM   orders
       WHERE  status != 'cancelled'
         AND  created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP  BY 1
       ORDER  BY 1`,
      [days],
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getSalesChart]', err);
    return api.error(res, 'Failed to fetch sales chart', 500);
  }
}

// GET /api/analytics/top-products?limit=10
export async function getTopProducts(req, res) {
  const limit = Math.min(50, parseInt(req.query.limit ?? '10', 10));
  try {
    const { rows } = await query(
      `SELECT
         p.id, p.name, p.main_image_url, p.price, p.discount_price,
         COUNT(oi.id)::INT                    AS order_count,
         SUM(oi.quantity)::INT                AS units_sold,
         COALESCE(SUM(oi.quantity * oi.unit_price),0)::FLOAT AS revenue
       FROM   order_items oi
       JOIN   products    p  ON p.id = oi.product_id
       JOIN   orders      o  ON o.id = oi.order_id
       WHERE  o.status != 'cancelled'
       GROUP  BY p.id
       ORDER  BY units_sold DESC
       LIMIT  $1`,
      [limit],
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getTopProducts]', err);
    return api.error(res, 'Failed to fetch top products', 500);
  }
}

// GET /api/analytics/category-breakdown
export async function getCategoryBreakdown(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         c.id, c.name,
         COUNT(DISTINCT p.id)::INT                AS product_count,
         COALESCE(SUM(oi.quantity),0)::INT        AS units_sold,
         COALESCE(SUM(oi.quantity*oi.unit_price),0)::FLOAT AS revenue
       FROM   categories c
       LEFT   JOIN products    p  ON p.category_id = c.id AND p.is_visible = TRUE
       LEFT   JOIN order_items oi ON oi.product_id = p.id
       LEFT   JOIN orders      o  ON o.id = oi.order_id AND o.status != 'cancelled'
       GROUP  BY c.id
       ORDER  BY revenue DESC`,
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getCategoryBreakdown]', err);
    return api.error(res, 'Failed to fetch category breakdown', 500);
  }
}

// GET /api/analytics/order-status-breakdown
export async function getOrderStatusBreakdown(req, res) {
  try {
    const { rows } = await query(
      `SELECT status, COUNT(*)::INT AS count, COALESCE(SUM(total_amount),0)::FLOAT AS total
       FROM   orders GROUP BY status ORDER BY count DESC`,
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getOrderStatusBreakdown]', err);
    return api.error(res, 'Failed to fetch order status breakdown', 500);
  }
}

// GET /api/analytics/inventory-health
export async function getInventoryHealth(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         p.id, p.name, p.status, p.main_image_url,
         COALESCE(SUM(i.quantity),0)::INT          AS total_stock,
         COUNT(pv.id)::INT                          AS variant_count,
         COUNT(CASE WHEN i.quantity=0 THEN 1 END)::INT  AS out_of_stock_variants,
         COUNT(CASE WHEN i.quantity>0 AND i.quantity<=i.low_stock_threshold THEN 1 END)::INT AS low_stock_variants
       FROM   products p
       LEFT   JOIN product_variants pv ON pv.product_id = p.id
       LEFT   JOIN inventory        i  ON i.variant_id  = pv.id
       WHERE  p.is_visible = TRUE
       GROUP  BY p.id
       ORDER  BY total_stock ASC
       LIMIT  50`,
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getInventoryHealth]', err);
    return api.error(res, 'Failed to fetch inventory health', 500);
  }
}

// GET /api/analytics/recent-activity?limit=20
export async function getRecentActivity(req, res) {
  const limit = Math.min(100, parseInt(req.query.limit ?? '20', 10));
  try {
    const { rows } = await query(
      `(SELECT 'order' AS type, o.id, u.name AS actor,
               'New order #' || o.id AS description,
               o.total_amount::FLOAT AS amount, o.created_at
        FROM orders o JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'user' AS type, u.id, u.name AS actor,
               'New user registered' AS description,
               NULL AS amount, u.created_at
        FROM users u WHERE u.role='customer'
        ORDER BY u.created_at DESC LIMIT $1)
       ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return api.success(res, rows);
  } catch (err) {
    console.error('[getRecentActivity]', err);
    return api.error(res, 'Failed to fetch recent activity', 500);
  }
}
