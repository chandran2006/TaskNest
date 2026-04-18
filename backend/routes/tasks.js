'use strict';

const express              = require('express');
const { body }             = require('express-validator');
const auth                 = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

// ─── CSRF Note ────────────────────────────────────────────────────────────────
// This API uses stateless JWT Bearer token authentication (Authorization header),
// not cookie-based sessions. Bearer token auth is inherently CSRF-safe because
// cross-origin requests cannot set the Authorization header via HTML forms.
// No additional CSRF middleware is required.

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

const createRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('title is required.')
    .isLength({ max: 255 }).withMessage('title must be 255 characters or fewer.'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('description must be 2000 characters or fewer.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('status must be pending, in_progress, or completed.'),
];

const updateRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('title cannot be empty.')
    .isLength({ max: 255 }).withMessage('title must be 255 characters or fewer.'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('description must be 2000 characters or fewer.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('status must be pending, in_progress, or completed.'),
];

router.use(auth);

router.get('/',       getTasks);
router.post('/',      createRules, createTask);
router.put('/:id',    updateRules, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
