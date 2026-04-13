'use strict';

const express              = require('express');
const { body }             = require('express-validator');
const { signup, login, getMe, getMembersCount } = require('../controllers/authController');
const auth                 = require('../middleware/auth');

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

module.exports = router;
