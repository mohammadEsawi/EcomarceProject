import { query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard  (admin)
// ---------------------------------------------------------------------------
export async function getDashboardStats(req, res) {
  try {
    // Run all stat queries in parallel for performance
    const [
      productsRes,
      ordersRes,
      revenueRes,
      pendingRes,
      lowStockRes,
      outOfStockRes,
      topProductsRes,
      recentOrdersRes,
    ] = await Promise.all([
      // Total products
      query(`SELECT COUNT(*)::INT AS total FROM products WHERE is_visible = TRUE`),

      // Total orders
      query(`SELECT COUNT(*)::INT AS total FROM orders`),

      // Revenue: sum of delivered + processing orders
      query(
        `SELECT COALESCE(SUM(total_amount), 0)::NUMERIC AS total_revenue
         FROM   orders
         WHERE  status IN ('delivered', 'processing')`,
      ),

      // Pending orders count
      query(
        `SELECT COUNT(*)::INT AS total FROM orders WHERE status = 'pending'`,
      ),

      // Low stock products count
      query(
        `SELECT COUNT(*)::INT AS total FROM products WHERE status = 'low_stock'`,
      ),

      // Out of stock products count
      query(
        `SELECT COUNT(*)::INT AS total FROM products WHERE status = 'out_of_stock'`,
      ),

      // Top 5 selling products by total units sold
      query(
        `SELECT p.id,
                p.name,
                p.main_image_url,
                SUM(oi.quantity)::INT AS units_sold,
                SUM(oi.quantity * oi.unit_price)::NUMERIC AS revenue
         FROM   order_items oi
         JOIN   products    p  ON p.id = oi.product_id
         GROUP  BY p.id, p.name, p.main_image_url
         ORDER  BY units_sold DESC
         LIMIT  5`,
      ),

      // Recent 5 orders with user email
      query(
        `SELECT o.id,
                o.status,
                o.total_amount,
                o.created_at,
                u.email AS user_email
         FROM   orders o
         LEFT   JOIN users u ON u.id = o.user_id
         ORDER  BY o.created_at DESC
         LIMIT  5`,
      ),
    ]);

    return api.success(res, {
      total_products:     productsRes.rows[0].total,
      total_orders:       ordersRes.rows[0].total,
      total_revenue:      parseFloat(revenueRes.rows[0].total_revenue),
      pending_orders:     pendingRes.rows[0].total,
      low_stock_products: lowStockRes.rows[0].total,
      out_of_stock_products: outOfStockRes.rows[0].total,
      top_selling_products: topProductsRes.rows,
      recent_orders:      recentOrdersRes.rows,
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    return api.error(res, 'Failed to fetch dashboard stats', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/accounts  (admin only)
// ---------------------------------------------------------------------------
export async function createAdminAccount(req, res) {
  // req.user is verified admin by the adminAuth middleware before reaching here
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return api.error(res, 'name, email and password are required');
  }

  try {
    // Check for duplicate email
    const existing = await query(
      `SELECT id FROM admins WHERE email = $1`,
      [email],
    );

    if (existing.rowCount > 0) {
      return api.error(res, 'An admin with this email already exists', 409);
    }

    const password_hash = await hashPassword(password);

    const result = await query(
      `INSERT INTO admins (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash],
    );

    return api.created(res, result.rows[0], 'Admin account created');
  } catch (err) {
    console.error('[createAdminAccount]', err);
    return api.error(res, 'Failed to create admin account', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/profile  (admin)
// ---------------------------------------------------------------------------
export async function getAdminProfile(req, res) {
  const adminId = req.user.id;

  try {
    const result = await query(
      `SELECT id, name, email, created_at FROM admins WHERE id = $1`,
      [adminId],
    );

    if (result.rowCount === 0) {
      return api.notFound(res, 'Admin not found');
    }

    return api.success(res, result.rows[0]);
  } catch (err) {
    console.error('[getAdminProfile]', err);
    return api.error(res, 'Failed to fetch admin profile', 500);
  }
}
