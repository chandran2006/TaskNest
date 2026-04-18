'use strict';

const { validationResult } = require('express-validator');
const db                   = require('../config/db');

// ─── Constants ────────────────────────────────────────────────────────────────
const TASK_SELECT = `
  SELECT
    t.id, t.title, t.description, t.status,
    t.created_by, t.organization_id,
    t.created_at, t.updated_at,
    u.name AS creator_name
  FROM tasks t
  LEFT JOIN users u ON t.created_by = u.id`;

const TASK_SELECT_ALL   = `${TASK_SELECT} WHERE t.organization_id = ? ORDER BY t.created_at DESC`;
const TASK_SELECT_MINE  = `${TASK_SELECT} WHERE t.organization_id = ? AND t.created_by = ? ORDER BY t.created_at DESC`;
const TASK_SELECT_BY_ID = `${TASK_SELECT} WHERE t.id = ?`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch role AND organization_id fresh from DB.
 * Never trust JWT claims for these — role changes and org joins must take
 * effect immediately without requiring a new token.
 */
async function getFreshUserData(userId) {
  const safeId = parseInt(userId, 10);
  if (!Number.isFinite(safeId) || safeId < 1) return null;
  const [[row]] = await db.query('SELECT role, organization_id FROM users WHERE id = ?', [safeId]);
  return row ?? null;
}

async function writeAuditLog(action, userId, taskId) {
  try {
    await db.query(
      'INSERT INTO audit_logs (action, user_id, task_id) VALUES (?, ?, ?)',
      [action, userId, taskId]
    );
  } catch (err) {
    console.error('[AuditLog] Write failed:', err.message);
  }
}

function formatTask(t) {
  return {
    id:              String(t.id),
    title:           t.title,
    description:     t.description || '',
    status:          t.status,
    created_by:      String(t.created_by),
    creator_name:    t.creator_name || null,
    organization_id: String(t.organization_id),
    createdAt:       t.created_at,
    updatedAt:       t.updated_at,
  };
}

function validationError(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return true;
  }
  return false;
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
async function getTasks(req, res) {
  const userId = parseInt(req.user.user_id, 10);

  try {
    const dbUser = await getFreshUserData(userId);
    if (!dbUser?.organization_id) {
      return res.status(403).json({ message: 'You must belong to an organization to access tasks.' });
    }

    const { role, organization_id: organizationId } = dbUser;
    const [rows] = role === 'admin'
      ? await db.query(TASK_SELECT_ALL,  [organizationId])
      : await db.query(TASK_SELECT_MINE, [organizationId, userId]);

    return res.status(200).json({ tasks: rows.map(formatTask) });
  } catch (err) {
    console.error('[Tasks] GET error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
async function createTask(req, res) {
  if (validationError(req, res)) return;

  const { title, description = '', status = 'pending' } = req.body;
  const userId = parseInt(req.user.user_id, 10);

  try {
    const dbUser = await getFreshUserData(userId);
    if (!dbUser?.organization_id) {
      return res.status(403).json({ message: 'You must belong to an organization to create tasks.' });
    }

    const { organization_id: organizationId } = dbUser;
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, status, created_by, organization_id) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), status, userId, organizationId]
    );

    const taskId = result.insertId;
    await writeAuditLog('CREATE', userId, taskId);

    const [[row]] = await db.query(TASK_SELECT_BY_ID, [taskId]);
    return res.status(201).json({ message: 'Task created successfully.', task: formatTask(row) });
  } catch (err) {
    console.error('[Tasks] POST error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
async function updateTask(req, res) {
  if (validationError(req, res)) return;

  const taskId = parseInt(req.params.id, 10);
  if (!Number.isFinite(taskId) || taskId < 1) {
    return res.status(400).json({ message: 'Invalid task id.' });
  }

  const { title, description, status } = req.body;
  const userId = parseInt(req.user.user_id, 10);

  try {
    const dbUser = await getFreshUserData(userId);
    if (!dbUser?.organization_id) {
      return res.status(403).json({ message: 'You must belong to an organization to update tasks.' });
    }

    const { role, organization_id: organizationId } = dbUser;
    const [[task]] = await db.query(
      'SELECT id, title, description, status, created_by FROM tasks WHERE id = ? AND organization_id = ?',
      [taskId, organizationId]
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (role !== 'admin' && task.created_by !== userId) {
      return res.status(403).json({ message: 'Forbidden. You can only edit your own tasks.' });
    }

    const newTitle       = title       !== undefined ? title.trim()       : task.title;
    const newDescription = description !== undefined ? description.trim() : (task.description || '');
    const newStatus      = status      !== undefined ? status             : task.status;

    await db.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newTitle, newDescription, newStatus, taskId]
    );

    await writeAuditLog('UPDATE', userId, taskId);

    const [[updated]] = await db.query(TASK_SELECT_BY_ID, [taskId]);
    return res.status(200).json({ message: 'Task updated successfully.', task: formatTask(updated) });
  } catch (err) {
    console.error('[Tasks] PUT error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
async function deleteTask(req, res) {
  const taskId = parseInt(req.params.id, 10);
  if (!Number.isFinite(taskId) || taskId < 1) {
    return res.status(400).json({ message: 'Invalid task id.' });
  }

  const userId = parseInt(req.user.user_id, 10);

  try {
    const dbUser = await getFreshUserData(userId);
    if (!dbUser?.organization_id) {
      return res.status(403).json({ message: 'You must belong to an organization to delete tasks.' });
    }

    const { role, organization_id: organizationId } = dbUser;
    const [[task]] = await db.query(
      'SELECT id, created_by FROM tasks WHERE id = ? AND organization_id = ?',
      [taskId, organizationId]
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (role !== 'admin' && task.created_by !== userId) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own tasks.' });
    }

    await writeAuditLog('DELETE', userId, taskId);
    await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('[Tasks] DELETE error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
