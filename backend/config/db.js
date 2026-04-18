'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'tasknest',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     30_000,
  timezone:           'Z',
  charset:            'utf8mb4',
  decimalNumbers:     true,
  multipleStatements: false,
  ssl:                process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Verify connection on startup — log only, never exit (let Render retry)
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
    // Do NOT process.exit — let the server start so Render health check passes.
    // Requests will fail with 500 until DB is reachable, which is recoverable.
  });

module.exports = pool;
