import { query } from '../config/database.js';
import * as api from '../utils/apiResponse.js';

// GET /api/notifications  (auth user)
export async function getMyNotifications(req, res) {
  const userId = req.user.id;
  const page  = Math.max(1, parseInt(req.query.page ?? '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit ?? '20', 10));
  const offset = (page - 1) * limit;

  try {
    const [rows, countRes] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      query(`SELECT COUNT(*)::INT AS total, COUNT(CASE WHEN is_read=FALSE THEN 1 END)::INT AS unread FROM notifications WHERE user_id=$1`, [userId]),
    ]);

    return api.success(res, {
      notifications: rows.rows,
      unread_count: countRes.rows[0].unread,
      pagination: { page, limit, total: countRes.rows[0].total, pages: Math.ceil(countRes.rows[0].total / limit) },
    });
  } catch (err) {
    console.error('[getMyNotifications]', err);
    return api.error(res, 'Failed to fetch notifications', 500);
  }
}

// PATCH /api/notifications/:id/read  (auth user)
export async function markRead(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2`,
      [id, userId],
    );
    if (!rowCount) return api.notFound(res, 'Notification not found');
    return api.success(res, null, 'Notification marked as read');
  } catch (err) {
    console.error('[markRead]', err);
    return api.error(res, 'Failed to update notification', 500);
  }
}

// PATCH /api/notifications/read-all  (auth user)
export async function markAllRead(req, res) {
  const userId = req.user.id;
  try {
    await query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND is_read=FALSE`, [userId]);
    return api.success(res, null, 'All notifications marked as read');
  } catch (err) {
    console.error('[markAllRead]', err);
    return api.error(res, 'Failed to update notifications', 500);
  }
}

// DELETE /api/notifications/:id  (auth user)
export async function deleteNotification(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const { rowCount } = await query(
      `DELETE FROM notifications WHERE id=$1 AND user_id=$2`, [id, userId],
    );
    if (!rowCount) return api.notFound(res, 'Notification not found');
    return api.success(res, null, 'Notification deleted');
  } catch (err) {
    console.error('[deleteNotification]', err);
    return api.error(res, 'Failed to delete notification', 500);
  }
}

// POST /api/notifications/send  (admin — broadcast or target)
export async function sendNotification(req, res) {
  const { user_id, title, message, type } = req.body;
  if (!title?.trim() || !message?.trim()) return api.error(res, 'title and message are required', 400);

  try {
    if (user_id) {
      // Single user
      const { rows } = await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4) RETURNING *`,
        [user_id, title, message, type ?? 'system'],
      );
      return api.created(res, rows[0], 'Notification sent');
    } else {
      // Broadcast to all customers
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         SELECT id, $1, $2, $3 FROM users WHERE role='customer' AND is_active=TRUE`,
        [title, message, type ?? 'promo'],
      );
      return api.success(res, null, 'Broadcast notification sent');
    }
  } catch (err) {
    console.error('[sendNotification]', err);
    return api.error(res, 'Failed to send notification', 500);
  }
}

// GET /api/notifications/unread-count  (auth user)
export async function getUnreadCount(req, res) {
  const userId = req.user.id;
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::INT AS count FROM notifications WHERE user_id=$1 AND is_read=FALSE`,
      [userId],
    );
    return api.success(res, { count: rows[0].count });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    return api.error(res, 'Failed to fetch count', 500);
  }
}
