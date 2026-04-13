'use strict';

require('dotenv').config();

const db   = require('./config/db');
const app  = require('./app');
const PORT = parseInt(process.env.PORT || '8080', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 TaskNest API  →  http://localhost:${PORT}`);
  console.log(`📋 Environment   →  ${process.env.NODE_ENV || 'development'}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully…`);

  // Force exit after 10 s if connections don't drain
  const forceExit = setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);

  server.close(async () => {
    clearTimeout(forceExit);
    try {
      await db.end();
      console.log('[Server] MySQL pool closed.');
    } catch (err) {
      console.error('[Server] Error closing DB pool:', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── Safety Nets ─────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  // Don't attempt graceful shutdown — process state is unknown after uncaughtException
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});
