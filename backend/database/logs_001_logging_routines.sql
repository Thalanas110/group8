-- Dedicated logging database for request and audit trails.

CREATE DATABASE IF NOT EXISTS examhub_logs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE examhub_logs;

CREATE TABLE IF NOT EXISTS request_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id CHAR(36) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status_code SMALLINT UNSIGNED NOT NULL,
  duration_ms INT UNSIGNED NOT NULL,
  user_id CHAR(36) NULL,
  role VARCHAR(32) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  error_summary VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
  PRIMARY KEY (id),
  KEY idx_request_logs_created_at (created_at),
  KEY idx_request_logs_path (path),
  KEY idx_request_logs_user_id (user_id),
  KEY idx_request_logs_status_code (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id CHAR(36) NOT NULL,
  action_method VARCHAR(10) NOT NULL,
  resource_path VARCHAR(255) NOT NULL,
  route_pattern VARCHAR(255) NULL,
  target_id VARCHAR(64) NULL,
  outcome ENUM('success', 'failure') NOT NULL,
  status_code SMALLINT UNSIGNED NOT NULL,
  duration_ms INT UNSIGNED NOT NULL,
  actor_user_id CHAR(36) NULL,
  actor_role VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
  PRIMARY KEY (id),
  KEY idx_audit_logs_created_at (created_at),
  KEY idx_audit_logs_method (action_method),
  KEY idx_audit_logs_resource_path (resource_path),
  KEY idx_audit_logs_actor_user_id (actor_user_id),
  KEY idx_audit_logs_outcome (outcome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_log_request_create;
DROP PROCEDURE IF EXISTS sp_log_audit_create;
DROP PROCEDURE IF EXISTS sp_log_retention_purge;

--  Exam Anti-Cheat Violations 
-- Declared here (before the stored procs) so sp_log_retention_purge can safely
-- reference the table at CREATE time on strict MySQL configurations.

CREATE TABLE IF NOT EXISTS exam_violations (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id       CHAR(36)        NOT NULL,
  student_id    CHAR(36)        NOT NULL,
  violation_no  TINYINT UNSIGNED NOT NULL COMMENT 'Ordinal counter for this student+exam (1, 2, 3...)',
  violation_type VARCHAR(64)    NOT NULL DEFAULT 'tab_switch' COMMENT 'tab_switch | window_blur | auto_submitted',
  details       VARCHAR(512)    NULL,
  occurred_at   DATETIME        NOT NULL DEFAULT UTC_TIMESTAMP(),
  PRIMARY KEY (id),
  KEY idx_ev_exam_id      (exam_id),
  KEY idx_ev_student_id   (student_id),
  KEY idx_ev_occurred_at  (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_violation_create;
DROP PROCEDURE IF EXISTS sp_violation_list_by_exam;

DELIMITER $$

CREATE PROCEDURE sp_log_request_create(
  IN p_request_id CHAR(36),
  IN p_method VARCHAR(10),
  IN p_path VARCHAR(255),
  IN p_status_code SMALLINT UNSIGNED,
  IN p_duration_ms INT UNSIGNED,
  IN p_user_id CHAR(36),
  IN p_role VARCHAR(32),
  IN p_ip_address VARCHAR(64),
  IN p_user_agent VARCHAR(512),
  IN p_error_summary VARCHAR(255)
)
BEGIN
  INSERT INTO request_logs (
    request_id,
    method,
    path,
    status_code,
    duration_ms,
    user_id,
    role,
    ip_address,
    user_agent,
    error_summary
  ) VALUES (
    p_request_id,
    UPPER(TRIM(COALESCE(p_method, 'GET'))),
    TRIM(COALESCE(p_path, '/')),
    COALESCE(p_status_code, 500),
    COALESCE(p_duration_ms, 0),
    NULLIF(TRIM(COALESCE(p_user_id, '')), ''),
    NULLIF(TRIM(COALESCE(p_role, '')), ''),
    NULLIF(TRIM(COALESCE(p_ip_address, '')), ''),
    NULLIF(TRIM(COALESCE(p_user_agent, '')), ''),
    NULLIF(TRIM(COALESCE(p_error_summary, '')), '')
  );
END$$

CREATE PROCEDURE sp_log_audit_create(
  IN p_request_id CHAR(36),
  IN p_action_method VARCHAR(10),
  IN p_resource_path VARCHAR(255),
  IN p_route_pattern VARCHAR(255),
  IN p_target_id VARCHAR(64),
  IN p_outcome VARCHAR(16),
  IN p_status_code SMALLINT UNSIGNED,
  IN p_duration_ms INT UNSIGNED,
  IN p_actor_user_id CHAR(36),
  IN p_actor_role VARCHAR(32)
)
BEGIN
  INSERT INTO audit_logs (
    request_id,
    action_method,
    resource_path,
    route_pattern,
    target_id,
    outcome,
    status_code,
    duration_ms,
    actor_user_id,
    actor_role
  ) VALUES (
    p_request_id,
    UPPER(TRIM(COALESCE(p_action_method, 'GET'))),
    TRIM(COALESCE(p_resource_path, '/')),
    NULLIF(TRIM(COALESCE(p_route_pattern, '')), ''),
    NULLIF(TRIM(COALESCE(p_target_id, '')), ''),
    IF(LOWER(TRIM(COALESCE(p_outcome, 'success'))) = 'failure', 'failure', 'success'),
    COALESCE(p_status_code, 500),
    COALESCE(p_duration_ms, 0),
    NULLIF(TRIM(COALESCE(p_actor_user_id, '')), ''),
    NULLIF(TRIM(COALESCE(p_actor_role, '')), '')
  );
END$$

CREATE PROCEDURE sp_log_retention_purge(IN p_retention_days INT)
BEGIN
  DECLARE v_retention_days INT DEFAULT 90;

  SET v_retention_days = COALESCE(p_retention_days, 90);
  IF v_retention_days < 1 THEN
    SET v_retention_days = 1;
  END IF;

  DELETE FROM request_logs
   WHERE created_at < (UTC_TIMESTAMP() - INTERVAL v_retention_days DAY);

  DELETE FROM audit_logs
   WHERE created_at < (UTC_TIMESTAMP() - INTERVAL v_retention_days DAY);

  DELETE FROM exam_violations
   WHERE occurred_at < (UTC_TIMESTAMP() - INTERVAL v_retention_days DAY);
END$$

DELIMITER ;

