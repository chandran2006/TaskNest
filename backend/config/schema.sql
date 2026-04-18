-- Run this file once to set up the TaskNest database
-- mysql -u root -p < backend/config/schema.sql

CREATE DATABASE IF NOT EXISTS tasknest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tasknest;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
-- organization_id is nullable: Google OAuth users start with no org
-- password is empty string for OAuth-only accounts
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL DEFAULT '',
  role            ENUM('admin','member') NOT NULL DEFAULT 'member',
  organization_id INT           NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_org FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE SET NULL
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT,
  status          ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  created_by      INT           NOT NULL,
  organization_id INT           NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_user FOREIGN KEY (created_by)      REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_org  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_tasks_org_status  (organization_id, status),
  INDEX idx_tasks_created_by  (created_by),
  INDEX idx_tasks_created_at  (created_at)
);

-- Audit logs (task_id nullable — logs survive task deletion)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  action     ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  user_id    INT       NOT NULL,
  task_id    INT       NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_user    (user_id),
  INDEX idx_audit_task    (task_id),
  INDEX idx_audit_created (created_at)
);

-- Default org so signup works immediately
INSERT IGNORE INTO organizations (id, name) VALUES (1, 'Default Organization');

-- If the table was created before this schema update, ensure organization_id allows NULL
-- ALTER TABLE users MODIFY organization_id INT NULL;
