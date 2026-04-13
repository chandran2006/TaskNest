-- Run this file once to set up the TaskNest database
-- mysql -u root -p tasknest < config/schema.sql

CREATE DATABASE IF NOT EXISTS tasknest;
USE tasknest;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL UNIQUE,
  password        TEXT          NOT NULL,
  role            VARCHAR(20)   NOT NULL DEFAULT 'member',
  organization_id INT           NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT,
  status          ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  created_by      INT           NOT NULL,
  organization_id INT           NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_user FOREIGN KEY (created_by)      REFERENCES users(id),
  CONSTRAINT fk_task_org  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_tasks_org_status (organization_id, status),
  INDEX idx_tasks_created_by (created_by)
);

-- Audit logs table
-- task_id is nullable to preserve logs after task deletion
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  action     ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  user_id    INT         NOT NULL,
  task_id    INT         NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_task (task_id)
);

-- Seed a default organization so signup works out of the box
INSERT IGNORE INTO organizations (id, name) VALUES (1, 'Default Organization');
