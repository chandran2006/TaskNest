'use strict';

const express              = require('express');
const { body }             = require('express-validator');
const jwt                  = require('jsonwebtoken');
const { signup, login, getMe, getMembersCount } = require('../controllers/authController');
const auth                 = require('../middleware/auth');
const passport             = require('../config/passport');

const router = express.Router();

const signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('name is required.')
    .isLength({ max: 100 }).withMessage('name must be 100 characters or fewer.'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required.'),
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
  body('email').trim().isEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('password is required.'),
];

router.post('/signup',         signupRules, signup);
router.post('/login',          loginRules,  login);
router.get('/me',              auth,        getMe);
router.get('/members/count',   auth,        getMembersCount);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  (req, res) => {
    const user  = req.user;
    const token = jwt.sign(
      { user_id: user.id, role: user.role, organization_id: user.organization_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}`);
  }
);

router.get('/google/failure', (_req, res) => {
  res.status(401).json({ message: 'Google authentication failed.' });
});

module.exports = router;
