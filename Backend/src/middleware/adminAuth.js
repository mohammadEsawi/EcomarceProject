import jwt from 'jsonwebtoken';

/**
 * Internal helper: verify the Bearer token and attach req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

/**
 * Middleware: allow only authenticated users with role === 'admin'.
 * Returns 403 if the user is authenticated but is not an admin.
 */
export const adminAuth = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    return next();
  });
};

/**
 * Middleware: allow any authenticated user (admin or regular user).
 * Useful for routes that need auth but are not admin-only.
 */
export const adminOrUser = (req, res, next) => {
  verifyToken(req, res, next);
};

export default adminAuth;
