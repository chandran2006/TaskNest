'use strict';

const db = require('../config/db');

/**
 * Always reads role fresh from DB — never trusts the JWT role.
 * This ensures role changes take effect immediately without a new token.
 */
async function adminOnly(req, res, next) {
  try {
    const [[row]] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.user_id]
    );
    if (row?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    // Attach fresh role so downstream handlers can use it
    req.user.role = 'admin';
    next();
  } catch (err) {
    console.error('[RBAC] adminOnly error:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { adminOnly };
