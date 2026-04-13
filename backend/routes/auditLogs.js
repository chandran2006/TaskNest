'use strict';

const express           = require('express');
const { query }         = require('express-validator');
const auth              = require('../middleware/auth');
const { adminOnly }     = require('../middleware/rbac');
const { getAuditLogs }  = require('../controllers/auditController');

const router = express.Router();

const queryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.').toInt(),
  query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE']).withMessage('Invalid action filter.'),
];

router.use(auth, adminOnly);
router.get('/', queryRules, getAuditLogs);

module.exports = router;
