-- Migration: Fix violation_case stored procedures to use fully-qualified examhub.users reference.
-- The violation_cases table lives in examhub_logs but user names/emails are in examhub.
-- Run this once against the examhub_logs database.

USE examhub_logs;

DROP PROCEDURE IF EXISTS sp_violation_case_upsert;
DROP PROCEDURE IF EXISTS sp_violation_case_get_by_exam;
DROP PROCEDURE IF EXISTS sp_violation_case_get_by_exam_student;

DELIMITER $$

CREATE PROCEDURE sp_violation_case_upsert(
  IN p_id            CHAR(36),
  IN p_exam_id       CHAR(36),
  IN p_student_id    CHAR(36),
  IN p_severity      VARCHAR(16),
  IN p_outcome       VARCHAR(32),
  IN p_teacher_notes TEXT,
  IN p_reviewed_by   CHAR(36)
)
BEGIN
  INSERT INTO violation_cases (id, exam_id, student_id, severity, outcome, teacher_notes, reviewed_by, reviewed_at)
  VALUES (
    p_id,
    p_exam_id,
    p_student_id,
    COALESCE(NULLIF(TRIM(p_severity), ''), 'low'),
    COALESCE(NULLIF(TRIM(p_outcome),  ''), 'pending'),
    NULLIF(TRIM(COALESCE(p_teacher_notes, '')), ''),
    NULLIF(TRIM(COALESCE(p_reviewed_by,   '')), ''),
    IF(NULLIF(TRIM(COALESCE(p_reviewed_by, '')), '') IS NOT NULL, UTC_TIMESTAMP(), NULL)
  )
  ON DUPLICATE KEY UPDATE
    severity      = VALUES(severity),
    outcome       = VALUES(outcome),
    teacher_notes = VALUES(teacher_notes),
    reviewed_by   = VALUES(reviewed_by),
    reviewed_at   = IF(VALUES(reviewed_by) IS NOT NULL, UTC_TIMESTAMP(), reviewed_at);

  SELECT
    vc.id,
    vc.exam_id        AS examId,
    vc.student_id     AS studentId,
    u.name            AS studentName,
    u.email           AS studentEmail,
    vc.severity,
    vc.outcome,
    vc.teacher_notes  AS teacherNotes,
    vc.reviewed_by    AS reviewedBy,
    rv.name           AS reviewerName,
    DATE_FORMAT(vc.reviewed_at, '%Y-%m-%dT%H:%i:%s')  AS reviewedAt,
    DATE_FORMAT(vc.created_ts,  '%Y-%m-%dT%H:%i:%s')  AS createdAt,
    DATE_FORMAT(vc.updated_ts,  '%Y-%m-%dT%H:%i:%s')  AS updatedAt
  FROM violation_cases vc
  INNER JOIN examhub.users u  ON u.id  = vc.student_id
  LEFT  JOIN examhub.users rv ON rv.id = vc.reviewed_by
  WHERE vc.exam_id    = p_exam_id
    AND vc.student_id = p_student_id
  LIMIT 1;
END$$

CREATE PROCEDURE sp_violation_case_get_by_exam(
  IN p_exam_id CHAR(36)
)
BEGIN
  SELECT
    vc.id,
    vc.exam_id        AS examId,
    vc.student_id     AS studentId,
    u.name            AS studentName,
    u.email           AS studentEmail,
    vc.severity,
    vc.outcome,
    vc.teacher_notes  AS teacherNotes,
    vc.reviewed_by    AS reviewedBy,
    rv.name           AS reviewerName,
    DATE_FORMAT(vc.reviewed_at, '%Y-%m-%dT%H:%i:%s')  AS reviewedAt,
    DATE_FORMAT(vc.created_ts,  '%Y-%m-%dT%H:%i:%s')  AS createdAt,
    DATE_FORMAT(vc.updated_ts,  '%Y-%m-%dT%H:%i:%s')  AS updatedAt
  FROM violation_cases vc
  INNER JOIN examhub.users u  ON u.id  = vc.student_id
  LEFT  JOIN examhub.users rv ON rv.id = vc.reviewed_by
  WHERE vc.exam_id = p_exam_id
  ORDER BY
    FIELD(vc.outcome, 'pending', 'warned', 'score_penalized', 'dismissed', 'invalidated'),
    FIELD(vc.severity, 'critical', 'high', 'medium', 'low');
END$$

CREATE PROCEDURE sp_violation_case_get_by_exam_student(
  IN p_exam_id    CHAR(36),
  IN p_student_id CHAR(36)
)
BEGIN
  SELECT
    vc.id,
    vc.exam_id        AS examId,
    vc.student_id     AS studentId,
    u.name            AS studentName,
    u.email           AS studentEmail,
    vc.severity,
    vc.outcome,
    vc.teacher_notes  AS teacherNotes,
    vc.reviewed_by    AS reviewedBy,
    rv.name           AS reviewerName,
    DATE_FORMAT(vc.reviewed_at, '%Y-%m-%dT%H:%i:%s')  AS reviewedAt,
    DATE_FORMAT(vc.created_ts,  '%Y-%m-%dT%H:%i:%s')  AS createdAt,
    DATE_FORMAT(vc.updated_ts,  '%Y-%m-%dT%H:%i:%s')  AS updatedAt
  FROM violation_cases vc
  INNER JOIN examhub.users u  ON u.id  = vc.student_id
  LEFT  JOIN examhub.users rv ON rv.id = vc.reviewed_by
  WHERE vc.exam_id    = p_exam_id
    AND vc.student_id = p_student_id
  LIMIT 1;
END$$

DELIMITER ;
