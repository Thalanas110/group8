-- Migration: Add submission_question_metrics table and stored procedures to examhub.
-- Run this against the examhub database for existing environments.

USE examhub;

CREATE TABLE IF NOT EXISTS submission_question_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id CHAR(36) NOT NULL,
  exam_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  topic VARCHAR(191) NULL,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  visit_count INT NOT NULL DEFAULT 0,
  answer_change_count INT NOT NULL DEFAULT 0,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_submission_question_metrics (submission_id, question_id),
  KEY idx_submission_question_metrics_exam_id (exam_id),
  KEY idx_submission_question_metrics_student_id (student_id),
  KEY idx_submission_question_metrics_topic (topic),
  CONSTRAINT fk_submission_question_metrics_submission FOREIGN KEY (submission_id) REFERENCES submissions(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_submission_question_metrics_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_submission_question_metrics_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_submission_question_metrics_delete_by_submission;
DROP PROCEDURE IF EXISTS sp_submission_question_metrics_upsert;
DROP PROCEDURE IF EXISTS sp_submission_question_metrics_get_all;

DELIMITER $$

CREATE PROCEDURE sp_submission_question_metrics_delete_by_submission(IN p_submission_id CHAR(36))
BEGIN
    DELETE FROM submission_question_metrics
    WHERE submission_id = p_submission_id;
END$$

CREATE PROCEDURE sp_submission_question_metrics_upsert(
    IN p_submission_id CHAR(36),
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36),
    IN p_question_id VARCHAR(64),
    IN p_topic VARCHAR(191),
    IN p_time_spent_seconds INT,
    IN p_visit_count INT,
    IN p_answer_change_count INT
)
BEGIN
    INSERT INTO submission_question_metrics (
        submission_id,
        exam_id,
        student_id,
        question_id,
        topic,
        time_spent_seconds,
        visit_count,
        answer_change_count
    ) VALUES (
        p_submission_id,
        p_exam_id,
        p_student_id,
        p_question_id,
        NULLIF(TRIM(COALESCE(p_topic, '')), ''),
        GREATEST(COALESCE(p_time_spent_seconds, 0), 0),
        GREATEST(COALESCE(p_visit_count, 0), 0),
        GREATEST(COALESCE(p_answer_change_count, 0), 0)
    )
    ON DUPLICATE KEY UPDATE
        topic = VALUES(topic),
        time_spent_seconds = VALUES(time_spent_seconds),
        visit_count = VALUES(visit_count),
        answer_change_count = VALUES(answer_change_count);
END$$

CREATE PROCEDURE sp_submission_question_metrics_get_all()
BEGIN
    SELECT
        submission_id AS submissionId,
        exam_id AS examId,
        student_id AS studentId,
        question_id AS questionId,
        topic,
        time_spent_seconds AS timeSpentSeconds,
        visit_count AS visitCount,
        answer_change_count AS answerChangeCount
    FROM submission_question_metrics
    ORDER BY created_ts DESC, id DESC;
END$$

DELIMITER ;
