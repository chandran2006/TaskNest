'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const schema = [
  `CREATE TABLE IF NOT EXISTS organizations (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            ENUM('admin','member') NOT NULL DEFAULT 'member',
    organization_id INT          NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    status          ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
    created_by      INT         NOT NULL,
    organization_id INT         NOT NULL,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_user FOREIGN KEY (created_by)      REFERENCES users(id),
    CONSTRAINT fk_task_org  FOREIGN KEY (organization_id) REFERENCES organizations(id),
    INDEX idx_tasks_org_status (organization_id, status),
    INDEX idx_tasks_created_by (created_by)
  )`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    action     ENUM('CREATE','UPDATE','DELETE') NOT NULL,
    user_id    INT         NOT NULL,
    task_id    INT         NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_task (task_id)
  )`,

  `INSERT IGNORE INTO organizations (id, name) VALUES (1, 'Default Organization')`,
];

async function setupDb() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      { rejectUnauthorized: false },
  });

  try {
    for (const sql of schema) {
      await conn.query(sql);
      console.log('✅', sql.trim().split('\n')[0].substring(0, 60));
    }
    console.log('\n🎉 Schema setup complete.');
  } finally {
    await conn.end();
  }
}

module.exports = setupDb;

// Allow running directly: node config/setupDb.js
if (require.main === module) {
  setupDb().catch((err) => {
    console.error('❌ Schema setup failed:', err.message);
    process.exit(1);
  });
}
