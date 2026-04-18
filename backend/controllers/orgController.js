'use strict';

const { generateToken } = require('../utils/jwt');
const db                = require('../config/db');

// ─── POST /api/org/select ─────────────────────────────────────────────────────
async function selectOrg(req, res) {
  const organization_id = parseInt(req.body.organization_id, 10);
  if (!organization_id || organization_id < 1) {
    return res.status(400).json({ message: 'Valid organization_id is required.' });
  }

  try {
    const [[org]] = await db.query('SELECT id, name FROM organizations WHERE id = ?', [organization_id]);
    if (!org) return res.status(404).json({ message: `Organization #${organization_id} not found.` });

    if (Number(req.user.organization_id) === organization_id) {
      return res.json({ message: `Already a member of "${org.name}".`, organization: org });
    }

    await db.query('UPDATE users SET organization_id = ? WHERE id = ?', [organization_id, req.user.user_id]);

    const [[updated]] = await db.query(
      'SELECT id, name, email, role, organization_id FROM users WHERE id = ?',
      [req.user.user_id]
    );
    const token = generateToken(updated);

    return res.json({ message: `Joined "${org.name}" successfully.`, organization: org, token });
  } catch (err) {
    console.error('[Org] selectOrg error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ─── POST /api/org/create ─────────────────────────────────────────────────────
async function createOrg(req, res) {
  const name = (req.body.name || '').trim();
  if (!name || name.length > 100) {
    return res.status(400).json({ message: 'Organization name is required (max 100 chars).' });
  }

  try {
    const [[existing]] = await db.query('SELECT id FROM organizations WHERE name = ?', [name]);
    if (existing) {
      return res.status(409).json({ message: `An organization named "${name}" already exists. Try joining it instead.` });
    }

    const [result] = await db.query('INSERT INTO organizations (name) VALUES (?)', [name]);
    const organization_id = result.insertId;

    await db.query('UPDATE users SET organization_id = ? WHERE id = ?', [organization_id, req.user.user_id]);

    const [[updated]] = await db.query(
      'SELECT id, name, email, role, organization_id FROM users WHERE id = ?',
      [req.user.user_id]
    );
    const token = generateToken(updated);

    return res.status(201).json({
      message: `Organization "${name}" created successfully.`,
      organization: { id: organization_id, name },
      token,
    });
  } catch (err) {
    console.error('[Org] createOrg error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { selectOrg, createOrg };
