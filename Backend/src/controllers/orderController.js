import { query, withTransaction } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Valid order-status transitions
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered',  'cancelled'],
  delivered:  [],
  cancelled:  [],
};

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
export async function createOrder(req, res) {
  const userId = req.user.id;
  const { items, shipping_address, payment_method, coupon_code } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return api.error(res, 'items must be a non-empty array');
  }
  if (!shipping_address || !payment_method) {
    return api.error(res, 'shipping_address and payment_method are required');
  }

  try {
    const order = await withTransaction(async (client) => {
      // ── 1 & 2: check inventory and fetch product details for each item ──
      const enrichedItems = [];

      for (const item of items) {
        const { variant_id, product_id, size_name, quantity } = item;

        if (!quantity || quantity < 1) {
          throw Object.assign(new Error('Each item must have a valid quantity'), { statusCode: 400 });
        }
        if (!variant_id && !product_id) {
          throw Object.assign(new Error('Each item must have variant_id or product_id'), { statusCode: 400 });
        }

        // Build query: lookup by variant_id OR by product_id + size_name
        let invRes;
        if (variant_id) {
          invRes = await client.query(
            `SELECT i.quantity, i.id AS inventory_id,
                    p.name AS product_name, p.price, p.discount_price,
                    c.name AS color_name, s.name AS size_name, pv.product_id, pv.id AS variant_id
             FROM inventory i
             JOIN product_variants pv ON pv.id = i.variant_id
             JOIN products p ON p.id = pv.product_id
             JOIN colors c ON c.id = pv.color_id
             JOIN sizes s ON s.id = pv.size_id
             WHERE i.variant_id = $1
             FOR UPDATE`,
            [variant_id],
          );
        } else {
          // Resolve variant from product_id + size_name (pick first available color)
          invRes = await client.query(
            `SELECT i.quantity, i.id AS inventory_id,
                    p.name AS product_name, p.price, p.discount_price,
                    c.name AS color_name, s.name AS size_name, pv.product_id, pv.id AS variant_id
             FROM inventory i
             JOIN product_variants pv ON pv.id = i.variant_id
             JOIN products p ON p.id = pv.product_id
             JOIN colors c ON c.id = pv.color_id
             JOIN sizes s ON s.id = pv.size_id
             WHERE pv.product_id = $1 AND s.name = $2 AND i.quantity > 0
             ORDER BY i.quantity DESC
             LIMIT 1
             FOR UPDATE`,
            [product_id, size_name],
          );
        }

        if (invRes.rowCount === 0) {
          throw Object.assign(
            new Error(variant_id ? `Variant ${variant_id} not found` : `No stock for product ${product_id} size ${size_name}`),
            { statusCode: 404 },
          );
        }

        const inv = invRes.rows[0];

        if (inv.quantity < quantity) {
          throw Object.assign(
            new Error(
              `Insufficient stock for "${inv.product_name}" (${inv.color_name} / ${inv.size_name}). ` +
              `Requested: ${quantity}, available: ${inv.quantity}`,
            ),
            { statusCode: 409 },
          );
        }

        enrichedItems.push({
          variant_id: inv.variant_id,
          quantity,
          inventory_id: inv.inventory_id,
          product_id:   inv.product_id,
          product_name: inv.product_name,
          color_name:   inv.color_name,
          size_name:    inv.size_name,
          unit_price:   parseFloat(inv.discount_price ?? inv.price),
        });
      }

      // ── 3: calculate subtotal ──
      let subtotal = enrichedItems.reduce(
        (sum, it) => sum + it.unit_price * it.quantity,
        0,
      );

      // ── 3 (cont): apply coupon if provided ──
      let discountAmount = 0;
      let appliedCoupon  = null;

      if (coupon_code) {
        const couponRes = await client.query(
          `SELECT id, discount_type, discount_value, min_order_amount, max_uses, used_count
           FROM   coupons
           WHERE  code      = $1
             AND  is_active = TRUE
             AND  (expires_at IS NULL OR expires_at > NOW())
             AND  (max_uses  IS NULL OR used_count < max_uses)`,
          [coupon_code],
        );

        if (couponRes.rowCount === 0) {
          throw Object.assign(
            new Error('Coupon is invalid, expired, or exhausted'),
            { statusCode: 400 },
          );
        }

        const coupon = couponRes.rows[0];

        if (subtotal < parseFloat(coupon.min_order_amount)) {
          throw Object.assign(
            new Error(
              `Order amount must be at least ${coupon.min_order_amount} to use this coupon`,
            ),
            { statusCode: 400 },
          );
        }

        if (coupon.discount_type === 'percentage') {
          discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
        } else {
          discountAmount = Math.min(parseFloat(coupon.discount_value), subtotal);
        }

        appliedCoupon = coupon;
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);

      // ── 4: INSERT order ──
      const orderRes = await client.query(
        `INSERT INTO orders
           (user_id, status, total_amount, discount_amount, coupon_code,
            shipping_address, payment_method)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          totalAmount.toFixed(2),
          discountAmount.toFixed(2),
          coupon_code ?? null,
          JSON.stringify(shipping_address),
          payment_method,
        ],
      );

      const newOrder = orderRes.rows[0];

      // ── 5: INSERT order_items ──
      const orderItems = [];
      for (const it of enrichedItems) {
        const itemRes = await client.query(
          `INSERT INTO order_items
             (order_id, variant_id, product_id, quantity, unit_price,
              color_name, size_name, product_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            newOrder.id, it.variant_id, it.product_id, it.quantity,
            it.unit_price.toFixed(2), it.color_name, it.size_name, it.product_name,
          ],
        );
        orderItems.push(itemRes.rows[0]);
      }

      // ── 6: UPDATE inventory ──
      for (const it of enrichedItems) {
        await client.query(
          `UPDATE inventory SET quantity = quantity - $1 WHERE id = $2`,
          [it.quantity, it.inventory_id],
        );
      }

      // ── 7: UPDATE coupon used_count ──
      if (appliedCoupon) {
        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
          [appliedCoupon.id],
        );
      }

      return { ...newOrder, items: orderItems };
    });

    return api.created(res, order, 'Order created successfully');
  } catch (err) {
    if (err.statusCode) {
      return api.error(res, err.message, err.statusCode);
    }
    console.error('[createOrder]', err);
    return api.error(res, 'Failed to create order', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/my
// ---------------------------------------------------------------------------
export async function getMyOrders(req, res) {
  const userId = req.user.id;
  const page   = Math.max(1, parseInt(req.query.page  ?? 1, 10));
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit ?? 10, 10)));
  const offset = (page - 1) * limit;

  try {
    const { rows } = await query(
      `SELECT o.*,
              COUNT(oi.id)::INT AS item_count
       FROM   orders      o
       LEFT   JOIN order_items oi ON oi.order_id = o.id
       WHERE  o.user_id = $1
       GROUP  BY o.id
       ORDER  BY o.created_at DESC
       LIMIT  $2 OFFSET $3`,
      [userId, limit, offset],
    );

    const countRes = await query(
      `SELECT COUNT(*)::INT AS total FROM orders WHERE user_id = $1`,
      [userId],
    );

    return api.success(res, {
      orders:      rows,
      pagination: {
        page,
        limit,
        total:       countRes.rows[0].total,
        total_pages: Math.ceil(countRes.rows[0].total / limit),
      },
    });
  } catch (err) {
    console.error('[getMyOrders]', err);
    return api.error(res, 'Failed to fetch orders', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------
export async function getOrderById(req, res) {
  const { id } = req.params;

  try {
    const orderRes = await query(
      `SELECT o.*,
              u.email AS user_email
       FROM   orders o
       LEFT   JOIN users u ON u.id = o.user_id
       WHERE  o.id = $1`,
      [id],
    );

    if (orderRes.rowCount === 0) {
      return api.notFound(res, 'Order not found');
    }

    const order = orderRes.rows[0];

    const isOwner = String(order.user_id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return api.forbidden(res, 'You are not allowed to view this order');
    }

    const itemsRes = await query(
      `SELECT oi.*,
              pi2.image_url AS product_image
       FROM   order_items oi
       LEFT   JOIN LATERAL (
                 SELECT pi.image_url
                 FROM   product_images pi
                 WHERE  pi.product_id = oi.product_id
                   AND  pi.is_main    = TRUE
                 LIMIT  1
               ) pi2 ON TRUE
       WHERE  oi.order_id = $1
       ORDER  BY oi.id`,
      [id],
    );

    return api.success(res, { ...order, items: itemsRes.rows });
  } catch (err) {
    console.error('[getOrderById]', err);
    return api.error(res, 'Failed to fetch order', 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders  (admin)
// ---------------------------------------------------------------------------
export async function getAllOrders(req, res) {
  const page   = Math.max(1, parseInt(req.query.page  ?? 1, 10));
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 20, 10)));
  const offset = (page - 1) * limit;

  const { status, date_from, date_to } = req.query;

  const conditions = [];
  const params     = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}::order_status`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`o.created_at >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`o.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT o.*,
              u.email       AS user_email,
              COUNT(oi.id)::INT AS item_count
       FROM   orders      o
       LEFT   JOIN users        u  ON u.id  = o.user_id
       LEFT   JOIN order_items  oi ON oi.order_id = o.id
       ${where}
       GROUP  BY o.id, u.email
       ORDER  BY o.created_at DESC
       LIMIT  $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countParams = params.slice(0, params.length - 2);
    const countRes = await query(
      `SELECT COUNT(DISTINCT o.id)::INT AS total
       FROM   orders o
       ${where}`,
      countParams,
    );

    return api.success(res, {
      orders: rows,
      pagination: {
        page,
        limit,
        total:       countRes.rows[0].total,
        total_pages: Math.ceil(countRes.rows[0].total / limit),
      },
    });
  } catch (err) {
    console.error('[getAllOrders]', err);
    return api.error(res, 'Failed to fetch orders', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/status  (admin)
// ---------------------------------------------------------------------------
export async function updateOrderStatus(req, res) {
  const { id }     = req.params;
  const { status } = req.body;

  if (!status) {
    return api.error(res, 'status is required');
  }

  try {
    const orderRes = await query(
      `SELECT id, status FROM orders WHERE id = $1`,
      [id],
    );

    if (orderRes.rowCount === 0) {
      return api.notFound(res, 'Order not found');
    }

    const current = orderRes.rows[0].status;
    const allowed = VALID_TRANSITIONS[current];

    if (!allowed || !allowed.includes(status)) {
      return api.error(
        res,
        `Cannot transition order from "${current}" to "${status}"`,
        422,
      );
    }

    const updated = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );

    return api.success(res, updated.rows[0], 'Order status updated');
  } catch (err) {
    console.error('[updateOrderStatus]', err);
    return api.error(res, 'Failed to update order status', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/cancel
// ---------------------------------------------------------------------------
export async function cancelOrder(req, res) {
  const { id }  = req.params;
  const userId  = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    const orderRes = await query(
      `SELECT id, user_id, status FROM orders WHERE id = $1`,
      [id],
    );

    if (orderRes.rowCount === 0) {
      return api.notFound(res, 'Order not found');
    }

    const order = orderRes.rows[0];

    const isOwner = String(order.user_id) === String(userId);

    if (!isOwner && !isAdmin) {
      return api.forbidden(res, 'You are not allowed to cancel this order');
    }

    if (!isAdmin && order.status !== 'pending') {
      return api.error(
        res,
        'Only pending orders can be cancelled by the customer',
        422,
      );
    }

    if (order.status === 'cancelled') {
      return api.error(res, 'Order is already cancelled', 422);
    }

    if (order.status === 'delivered') {
      return api.error(res, 'Delivered orders cannot be cancelled', 422);
    }

    const updated = await withTransaction(async (client) => {
      // Restore inventory
      const itemsRes = await client.query(
        `SELECT variant_id, quantity FROM order_items WHERE order_id = $1`,
        [id],
      );

      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE inventory SET quantity = quantity + $1 WHERE variant_id = $2`,
          [item.quantity, item.variant_id],
        );
      }

      const res2 = await client.query(
        `UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
        [id],
      );

      return res2.rows[0];
    });

    return api.success(res, updated, 'Order cancelled successfully');
  } catch (err) {
    console.error('[cancelOrder]', err);
    return api.error(res, 'Failed to cancel order', 500);
  }
}
