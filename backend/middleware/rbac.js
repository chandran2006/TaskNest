'use strict';

// All requires are top-level — no lazy loading
const db = require('../config/db');

/**
 * Always reads role fresh from DB — never trusts the JWT role.
 * This ensures role changes take effect immediately without a new token.
 * Uses a parameterized query — safe from SQL injection.
 */
async function adminOnly(req, res, next) {
  const userId = parseInt(req.user.user_id, 10);
  if (!Number.isFinite(userId) || userId < 1) {
    return res.status(401).json({ message: 'Invalid user identity.' });
  }

  try {
    const [[row]] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    if (row?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    req.user.role = 'admin';
    next();
  } catch (err) {
    console.error('[RBAC] adminOnly error:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { adminOnly };
