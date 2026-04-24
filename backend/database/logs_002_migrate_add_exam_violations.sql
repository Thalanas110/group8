-- Migration: Add exam_violations table and stored procedures to examhub_logs
-- Run this once in phpMyAdmin against the examhub_logs database.

USE examhub_logs;

--  Table 

CREATE TABLE IF NOT EXISTS exam_violations (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  exam_id       CHAR(36)         NOT NULL,
  student_id    CHAR(36)         NOT NULL,
  violation_no  TINYINT UNSIGNED NOT NULL COMMENT 'Ordinal counter for this student+exam (1, 2, 3...)',
  violation_type VARCHAR(64)     NOT NULL DEFAULT 'tab_switch' COMMENT 'tab_switch | window_blur | auto_submitted',
  details       VARCHAR(512)     NULL,
  occurred_at   DATETIME         NOT NULL DEFAULT UTC_TIMESTAMP(),
  PRIMARY KEY (id),
  KEY idx_ev_exam_id     (exam_id),
  KEY idx_ev_student_id  (student_id),
  KEY idx_ev_occurred_at (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--  Stored Procedures 

DROP PROCEDURE IF EXISTS sp_violation_create;
DROP PROCEDURE IF EXISTS sp_violation_list_by_exam;

DELIMITER $$

CREATE PROCEDURE sp_violation_create(
  IN p_exam_id        CHAR(36),
  IN p_student_id     CHAR(36),
  IN p_violation_type VARCHAR(64),
  IN p_details        VARCHAR(512)
)
BEGIN
  DECLARE v_next_no TINYINT UNSIGNED DEFAULT 1;

  SELECT COALESCE(MAX(violation_no), 0) + 1
    INTO v_next_no
    FROM exam_violations
   WHERE exam_id    = p_exam_id
     AND student_id = p_student_id;

  INSERT INTO exam_violations (exam_id, student_id, violation_no, violation_type, details)
  VALUES (
    p_exam_id,
    p_student_id,
    v_next_no,
    COALESCE(NULLIF(TRIM(p_violation_type), ''), 'tab_switch'),
    NULLIF(TRIM(COALESCE(p_details, '')), '')
  );

  SELECT id, exam_id, student_id, violation_no, violation_type, details, occurred_at
    FROM exam_violations
   WHERE id = LAST_INSERT_ID();
END$$

CREATE PROCEDURE sp_violation_list_by_exam(
  IN p_exam_id CHAR(36)
)
BEGIN
  SELECT id, exam_id, student_id, violation_no, violation_type, details, occurred_at
    FROM exam_violations
   WHERE exam_id = p_exam_id
   ORDER BY occurred_at ASC;
END$$

DELIMITER ;
