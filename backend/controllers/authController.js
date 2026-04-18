'use strict';

const bcrypt               = require('bcryptjs');
const { validationResult } = require('express-validator');
const db                   = require('../config/db');
const { generateToken }    = require('../utils/jwt');

function formatUser(dbRow) {
  return {
    id:              String(dbRow.id),
    name:            dbRow.name,
    email:           dbRow.email,
    role:            dbRow.role,
    organization_id: dbRow.organization_id != null ? String(dbRow.organization_id) : null,
  };
}

// POST /api/auth/signup
async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { name, email, password, organization_id, role: requestedRole, adminKey } = req.body;

  let role = 'member';
  if (requestedRole === 'admin') {
    if (!process.env.ADMIN_SIGNUP_KEY || adminKey !== process.env.ADMIN_SIGNUP_KEY) {
      return res.status(403).json({ message: 'Invalid admin key.' });
    }
    role = 'admin';
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanName  = name.trim();

  try {
    const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const [[org]] = await db.query('SELECT id FROM organizations WHERE id = ?', [organization_id]);
    if (!org) {
      return res.status(404).json({
        message: `Organization ${organization_id} not found. Use id 1 for the default org.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, organization_id) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, hashedPassword, role, organization_id]
    );

    const rawRow = { id: result.insertId, name: cleanName, email: cleanEmail, role, organization_id };
    return res.status(201).json({
      message: 'Account created successfully.',
      token: generateToken(rawRow),
      user:  formatUser(rawRow),
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { email, password } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, password, role, organization_id FROM users WHERE email = ?',
      [cleanEmail]
    );

    // Timing-safe: always run bcrypt even when user not found
    const DUMMY_HASH    = '$2a$12$dummyhashfortimingprotection.000000000000000000000000';
    const dbUser        = rows[0] || null;
    const hashToCompare = dbUser?.password || DUMMY_HASH;
    const isMatch       = await bcrypt.compare(password, hashToCompare);

    if (!dbUser || !isMatch || dbUser.password === '') {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.status(200).json({
      message: 'Login successful.',
      token: generateToken(dbUser),
      user:  formatUser(dbUser),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const [[dbUser]] = await db.query(
      'SELECT id, name, email, role, organization_id FROM users WHERE id = ?',
      [req.user.user_id]
    );
    if (!dbUser) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: formatUser(dbUser) });
  } catch (err) {
    console.error('[Auth] GetMe error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// GET /api/auth/members/count
async function getMembersCount(req, res) {
  try {
    const [[dbUser]] = await db.query(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.user_id]
    );
    if (!dbUser?.organization_id) return res.json({ count: 0 });

    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM users WHERE organization_id = ?',
      [dbUser.organization_id]
    );
    return res.json({ count: Number(count) });
  } catch (err) {
    console.error('[Auth] getMembersCount error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// PUT /api/auth/me/organization
async function setOrganization(req, res) {
  const { organization_id } = req.body;
  if (!organization_id || !Number.isInteger(Number(organization_id))) {
    return res.status(400).json({ message: 'Valid organization_id is required.' });
  }

  try {
    const [[org]] = await db.query('SELECT id FROM organizations WHERE id = ?', [organization_id]);
    if (!org) return res.status(404).json({ message: `Organization ${organization_id} not found.` });

    await db.query('UPDATE users SET organization_id = ? WHERE id = ?', [organization_id, req.user.user_id]);

    const [[updated]] = await db.query(
      'SELECT id, name, email, role, organization_id FROM users WHERE id = ?',
      [req.user.user_id]
    );
    // Return fresh token so JWT organization_id is never stale
    return res.json({ user: formatUser(updated), token: generateToken(updated) });
  } catch (err) {
    console.error('[Auth] setOrganization error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { signup, login, getMe, getMembersCount, setOrganization };
