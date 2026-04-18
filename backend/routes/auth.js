'use strict';

const express              = require('express');
const { body }             = require('express-validator');
const { signup, login, getMe, getMembersCount, setOrganization } = require('../controllers/authController');
const auth                 = require('../middleware/auth');
const passport             = require('../config/passport');
const { generateToken }    = require('../utils/jwt');

const router = express.Router();

// ─── CSRF Note ────────────────────────────────────────────────────────────────
// This API uses stateless JWT Bearer token authentication (Authorization header),
// not cookie-based sessions. Bearer token auth is inherently CSRF-safe because
// cross-origin requests cannot set the Authorization header via HTML forms.
// No additional CSRF middleware is required.

// ─── SSRF prevention: validate FRONTEND_URL once at startup ──────────────────
// SAFE_FRONTEND_URL is a module-level constant — never derived from user input.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000'
).split(',').map((o) => o.trim());

const RAW_FRONTEND_URL  = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const SAFE_FRONTEND_URL = ALLOWED_ORIGINS.includes(RAW_FRONTEND_URL)
  ? RAW_FRONTEND_URL
  : ALLOWED_ORIGINS[0];

if (RAW_FRONTEND_URL !== SAFE_FRONTEND_URL) {
  console.warn(`[Auth] FRONTEND_URL "${RAW_FRONTEND_URL}" not in ALLOWED_ORIGINS — using "${SAFE_FRONTEND_URL}"`);
}

// ─── Validation rules ─────────────────────────────────────────────────────────
const signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('name is required.')
    .isLength({ max: 100 }).withMessage('name must be 100 characters or fewer.'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('role must be admin or member.'),
  body('adminKey')
    .optional()
    .isString(),
  body('organization_id')
    .isInt({ min: 1 }).withMessage('organization_id must be a positive integer.')
    .toInt(),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/signup',         signupRules, signup);
router.post('/login',          loginRules,  login);
router.get('/me',              auth,        getMe);
router.get('/members/count',   auth,        getMembersCount);
router.put('/me/organization', auth,        setOrganization);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${SAFE_FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

router.get('/google/failure', (_req, res) => {
  res.status(401).json({ message: 'Google authentication failed.' });
});

module.exports = router;
