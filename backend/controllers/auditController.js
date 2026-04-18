'use strict';

const { validationResult } = require('express-validator');
const db                   = require('../config/db');

const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

// Two fully static query variants — no dynamic SQL concatenation
const SQL = {
  listAll: `
    SELECT al.id, al.action, al.task_id, al.user_id, al.created_at AS timestamp,
           u.name AS user_name, u.email AS user_email, t.title AS task_title
    FROM audit_logs al
    INNER JOIN users u ON al.user_id = u.id
    LEFT  JOIN tasks t ON al.task_id = t.id
    WHERE u.organization_id = ?
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,

  listByAction: `
    SELECT al.id, al.action, al.task_id, al.user_id, al.created_at AS timestamp,
           u.name AS user_name, u.email AS user_email, t.title AS task_title
    FROM audit_logs al
    INNER JOIN users u ON al.user_id = u.id
    LEFT  JOIN tasks t ON al.task_id = t.id
    WHERE u.organization_id = ? AND al.action = ?
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,

  countAll: `
    SELECT COUNT(*) AS total
    FROM audit_logs al
    INNER JOIN users u ON al.user_id = u.id
    WHERE u.organization_id = ?`,

  countByAction: `
    SELECT COUNT(*) AS total
    FROM audit_logs al
    INNER JOIN users u ON al.user_id = u.id
    WHERE u.organization_id = ? AND al.action = ?`,
};

// ─── GET /api/audit-logs ──────────────────────────────────────────────────────
async function getAuditLogs(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const action = req.query.action ? String(req.query.action).toUpperCase() : null;
  if (action && !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ message: 'action must be CREATE, UPDATE, or DELETE.' });
  }

  const page   = Math.max(1, parseInt(req.query.page  || '1',  10));
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;

  try {
    // Always read org fresh from DB — JWT organization_id may be stale
    const userId = parseInt(req.user.user_id, 10);
    const [[dbUser]] = await db.query('SELECT organization_id FROM users WHERE id = ?', [userId]);
    const organizationId = dbUser?.organization_id ?? null;

    if (!organizationId) {
      return res.status(403).json({ message: 'You must belong to an organization to view audit logs.' });
    }

    const [
      [[{ total }]],
      [rows],
    ] = await Promise.all(
      action
        ? [
            db.query(SQL.countByAction, [organizationId, action]),
            db.query(SQL.listByAction,  [organizationId, action, limit, offset]),
          ]
        : [
            db.query(SQL.countAll, [organizationId]),
            db.query(SQL.listAll,  [organizationId, limit, offset]),
          ]
    );

    const logs = rows.map((log) => ({
      id:         String(log.id),
      action:     log.action,
      task_id:    log.task_id != null ? String(log.task_id) : null,
      user_id:    String(log.user_id),
      user_name:  log.user_name,
      user_email: log.user_email,
      task_title: log.task_title || '(deleted)',
      timestamp:  log.timestamp,
    }));

    return res.status(200).json({
      logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[AuditLogs] GET error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getAuditLogs };
