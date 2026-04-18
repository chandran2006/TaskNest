'use strict';

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan    = require('morgan');
require('dotenv').config();

const passport       = require('./config/passport');
const authRoutes     = require('./routes/auth');
const taskRoutes     = require('./routes/tasks');
const auditLogRoutes = require('./routes/auditLogs');
const orgRoutes      = require('./routes/org');

const app = express();

// ─── Health Check (MUST be first — Render sends HEAD / before any middleware) ─
app.get('/',          (_req, res) => res.send('TaskNest Backend Running 🚀'));
app.head('/',         (_req, res) => res.sendStatus(200));
app.get('/api/health', (_req, res) => res.json({
  status:    'ok',
  service:   'TaskNest API',
  timestamp: new Date().toISOString(),
  uptime:    Math.floor(process.uptime()),
  env:       process.env.NODE_ENV || 'development',
}));

// ─── One-time DB Setup Route ─────────────────────────────────────────────────────
app.get('/setup-db', async (_req, res) => {
  try {
    const setupDb = require('./config/setupDb');
    await setupDb();
    res.send('✅ DB Setup Done — all tables created.');
  } catch (err) {
    console.error('[Setup] DB setup error:', err.message);
    res.status(500).send(`❌ DB Setup Failed: ${err.message}`);
  }
});

// ─── Security Headers ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Passport (sessionless) ───────────────────────────────────────────────────
app.use(passport.initialize());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth',        authRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/audit-logs',  auditLogRoutes);
app.use('/api/org',         orgRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = app;
