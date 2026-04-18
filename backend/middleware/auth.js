'use strict';

// All requires are top-level — no lazy loading
const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT and attaches decoded payload to req.user.
 * Payload shape: { user_id, name, email, role, organization_id }
 *
 * CSRF: This API uses Bearer token auth (Authorization header), not cookies.
 * Bearer tokens are inherently CSRF-safe — no CSRF middleware needed.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = authMiddleware;
