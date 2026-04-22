-- Migration: Add per-student, per-exam accommodations with encrypted accessibility preferences.
-- Run this against the examhub database for existing environments.

USE examhub;

CREATE TABLE IF NOT EXISTS student_exam_accommodations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  extra_time_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  alternate_start_at DATETIME NULL,
  alternate_end_at DATETIME NULL,
  attempt_limit INT UNSIGNED NULL,
  accessibility_preferences_ciphertext TEXT NULL,
  accessibility_preferences_iv VARCHAR(24) NULL,
  accessibility_preferences_tag VARCHAR(24) NULL,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_exam_accommodations_exam_student (exam_id, student_id),
  KEY idx_student_exam_accommodations_student_exam (student_id, exam_id),
  CONSTRAINT fk_student_exam_accommodations_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_student_exam_accommodations_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_student_exam_accommodations_get_by_exam;
DROP PROCEDURE IF EXISTS sp_student_exam_accommodations_get_by_exam_student;
DROP PROCEDURE IF EXISTS sp_student_exam_accommodations_get_by_student;
DROP PROCEDURE IF EXISTS sp_student_exam_accommodations_upsert;
DROP PROCEDURE IF EXISTS sp_student_exam_accommodations_delete;

DELIMITER $$

CREATE PROCEDURE sp_student_exam_accommodations_get_by_exam(IN p_exam_id CHAR(36))
BEGIN
    SELECT
        a.id,
        a.exam_id AS examId,
        a.student_id AS studentId,
        a.extra_time_minutes AS extraTimeMinutes,
        IFNULL(DATE_FORMAT(a.alternate_start_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateStartAt,
        IFNULL(DATE_FORMAT(a.alternate_end_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateEndAt,
        a.attempt_limit AS attemptLimit,
        a.accessibility_preferences_ciphertext AS accessibilityPreferencesCiphertext,
        a.accessibility_preferences_iv AS accessibilityPreferencesIv,
        a.accessibility_preferences_tag AS accessibilityPreferencesTag,
        DATE_FORMAT(a.created_ts, '%Y-%m-%dT%H:%i:%s') AS createdAt,
        DATE_FORMAT(a.updated_ts, '%Y-%m-%dT%H:%i:%s') AS updatedAt
    FROM student_exam_accommodations a
    WHERE a.exam_id = p_exam_id
    ORDER BY a.created_ts ASC, a.id ASC;
END$$

CREATE PROCEDURE sp_student_exam_accommodations_get_by_exam_student(
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36)
)
BEGIN
    SELECT
        a.id,
        a.exam_id AS examId,
        a.student_id AS studentId,
        a.extra_time_minutes AS extraTimeMinutes,
        IFNULL(DATE_FORMAT(a.alternate_start_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateStartAt,
        IFNULL(DATE_FORMAT(a.alternate_end_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateEndAt,
        a.attempt_limit AS attemptLimit,
        a.accessibility_preferences_ciphertext AS accessibilityPreferencesCiphertext,
        a.accessibility_preferences_iv AS accessibilityPreferencesIv,
        a.accessibility_preferences_tag AS accessibilityPreferencesTag,
        DATE_FORMAT(a.created_ts, '%Y-%m-%dT%H:%i:%s') AS createdAt,
        DATE_FORMAT(a.updated_ts, '%Y-%m-%dT%H:%i:%s') AS updatedAt
    FROM student_exam_accommodations a
    WHERE a.exam_id = p_exam_id
      AND a.student_id = p_student_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_student_exam_accommodations_get_by_student(IN p_student_id CHAR(36))
BEGIN
    SELECT
        a.id,
        a.exam_id AS examId,
        a.student_id AS studentId,
        a.extra_time_minutes AS extraTimeMinutes,
        IFNULL(DATE_FORMAT(a.alternate_start_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateStartAt,
        IFNULL(DATE_FORMAT(a.alternate_end_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS alternateEndAt,
        a.attempt_limit AS attemptLimit,
        a.accessibility_preferences_ciphertext AS accessibilityPreferencesCiphertext,
        a.accessibility_preferences_iv AS accessibilityPreferencesIv,
        a.accessibility_preferences_tag AS accessibilityPreferencesTag,
        DATE_FORMAT(a.created_ts, '%Y-%m-%dT%H:%i:%s') AS createdAt,
        DATE_FORMAT(a.updated_ts, '%Y-%m-%dT%H:%i:%s') AS updatedAt
    FROM student_exam_accommodations a
    WHERE a.student_id = p_student_id
    ORDER BY a.created_ts ASC, a.id ASC;
END$$

CREATE PROCEDURE sp_student_exam_accommodations_upsert(
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36),
    IN p_extra_time_minutes INT,
    IN p_alternate_start_at DATETIME,
    IN p_alternate_end_at DATETIME,
    IN p_attempt_limit INT,
    IN p_accessibility_preferences_ciphertext TEXT,
    IN p_accessibility_preferences_iv VARCHAR(24),
    IN p_accessibility_preferences_tag VARCHAR(24)
)
BEGIN
    INSERT INTO student_exam_accommodations (
        exam_id,
        student_id,
        extra_time_minutes,
        alternate_start_at,
        alternate_end_at,
        attempt_limit,
        accessibility_preferences_ciphertext,
        accessibility_preferences_iv,
        accessibility_preferences_tag
    ) VALUES (
        p_exam_id,
        p_student_id,
        GREATEST(COALESCE(p_extra_time_minutes, 0), 0),
        p_alternate_start_at,
        p_alternate_end_at,
        CASE
            WHEN p_attempt_limit IS NULL OR p_attempt_limit <= 0 THEN NULL
            ELSE p_attempt_limit
        END,
        p_accessibility_preferences_ciphertext,
        p_accessibility_preferences_iv,
        p_accessibility_preferences_tag
    )
    ON DUPLICATE KEY UPDATE
        extra_time_minutes = VALUES(extra_time_minutes),
        alternate_start_at = VALUES(alternate_start_at),
        alternate_end_at = VALUES(alternate_end_at),
        attempt_limit = VALUES(attempt_limit),
        accessibility_preferences_ciphertext = VALUES(accessibility_preferences_ciphertext),
        accessibility_preferences_iv = VALUES(accessibility_preferences_iv),
        accessibility_preferences_tag = VALUES(accessibility_preferences_tag);

    CALL sp_student_exam_accommodations_get_by_exam_student(p_exam_id, p_student_id);
END$$

CREATE PROCEDURE sp_student_exam_accommodations_delete(
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36)
)
BEGIN
    DELETE FROM student_exam_accommodations
    WHERE exam_id = p_exam_id
      AND student_id = p_student_id;
END$$

DELIMITER ;
