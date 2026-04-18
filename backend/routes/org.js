'use strict';

const express = require('express');
const auth    = require('../middleware/auth');
const { selectOrg, createOrg } = require('../controllers/orgController');

const router = express.Router();

// ─── CSRF Note ────────────────────────────────────────────────────────────────
// This API uses stateless JWT Bearer token authentication (Authorization header),
// not cookie-based sessions. Bearer token auth is inherently CSRF-safe because
// cross-origin requests cannot set the Authorization header via HTML forms.
// No additional CSRF middleware is required.

router.post('/select', auth, selectOrg);
router.post('/create', auth, createOrg);

module.exports = router;
