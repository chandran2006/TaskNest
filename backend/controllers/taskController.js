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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Always fetch the current role from DB — never trust the JWT role alone.
 * This ensures role changes (e.g. member → admin) take effect immediately
 * without requiring a new token.
 */
async function getFreshRole(user_id) {
  const [[row]] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);
  return row?.role ?? 'member';
}

async function writeAuditLog(action, user_id, task_id) {
  try {
    await db.query(
      'INSERT INTO audit_logs (action, user_id, task_id) VALUES (?, ?, ?)',
      [action, user_id, task_id]
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
  const { user_id, organization_id } = req.user;
  if (!organization_id) return res.status(403).json({ message: 'You must belong to an organization to access tasks.' });

  try {
    const role = await getFreshRole(user_id);

    const [rows] = role === 'admin'
      ? await db.query(
          `${TASK_SELECT} WHERE t.organization_id = ? ORDER BY t.created_at DESC`,
          [organization_id]
        )
      : await db.query(
          `${TASK_SELECT} WHERE t.organization_id = ? AND t.created_by = ? ORDER BY t.created_at DESC`,
          [organization_id, user_id]
        );

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
  const { user_id, organization_id } = req.user;
  if (!organization_id) return res.status(403).json({ message: 'You must belong to an organization to create tasks.' });

  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, status, created_by, organization_id) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), status, user_id, organization_id]
    );

    const taskId = result.insertId;
    await writeAuditLog('CREATE', user_id, taskId);

    const [[row]] = await db.query(`${TASK_SELECT} WHERE t.id = ?`, [taskId]);

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
  const { user_id, organization_id } = req.user;

  try {
    const role = await getFreshRole(user_id);

    const [[task]] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND organization_id = ?',
      [taskId, organization_id]
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (role !== 'admin' && task.created_by !== user_id) {
      return res.status(403).json({ message: 'Forbidden. You can only edit your own tasks.' });
    }

    const newTitle       = title       !== undefined ? title.trim()       : task.title;
    const newDescription = description !== undefined ? description.trim() : (task.description || '');
    const newStatus      = status      !== undefined ? status             : task.status;

    await db.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newTitle, newDescription, newStatus, taskId]
    );

    await writeAuditLog('UPDATE', user_id, taskId);

    const [[updated]] = await db.query(`${TASK_SELECT} WHERE t.id = ?`, [taskId]);

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

  const { user_id, organization_id } = req.user;

  try {
    const role = await getFreshRole(user_id);

    const [[task]] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND organization_id = ?',
      [taskId, organization_id]
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (role !== 'admin' && task.created_by !== user_id) {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own tasks.' });
    }

    await writeAuditLog('DELETE', user_id, taskId);
    await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('[Tasks] DELETE error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
