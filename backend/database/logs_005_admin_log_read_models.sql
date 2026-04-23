-- Migration: Add read-only admin log and violation dashboard routines.
-- Run this after logs_004_migrate_fix_violation_case_procedures.sql.

USE examhub_logs;

DROP PROCEDURE IF EXISTS sp_admin_log_activity_read;
DROP PROCEDURE IF EXISTS sp_admin_violation_dashboard;

DELIMITER $$

CREATE PROCEDURE sp_admin_log_activity_read(IN p_limit INT)
BEGIN
  DECLARE v_limit INT DEFAULT 200;

  SET v_limit = COALESCE(p_limit, 200);
  IF v_limit < 1 THEN
    SET v_limit = 1;
  END IF;
  IF v_limit > 500 THEN
    SET v_limit = 500;
  END IF;

  SELECT
    COUNT(*) AS totalRequests,
    COALESCE(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END), 0) AS failedRequests,
    COALESCE(ROUND(AVG(duration_ms)), 0) AS averageDurationMs,
    COUNT(DISTINCT user_id) AS uniqueUsers,
    DATE_FORMAT(MAX(created_at), '%Y-%m-%dT%H:%i:%s') AS latestRequestAt
  FROM request_logs
  WHERE created_at >= (UTC_TIMESTAMP() - INTERVAL 7 DAY);

  SELECT
    id,
    request_id AS requestId,
    method,
    path,
    status_code AS statusCode,
    duration_ms AS durationMs,
    user_id AS userId,
    role,
    ip_address AS ipAddress,
    user_agent AS userAgent,
    error_summary AS errorSummary,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS createdAt
  FROM request_logs
  ORDER BY created_at DESC, id DESC
  LIMIT v_limit;

  SELECT
    COUNT(*) AS totalAuditEvents,
    COALESCE(SUM(CASE WHEN outcome = 'failure' THEN 1 ELSE 0 END), 0) AS failedAuditEvents,
    COUNT(DISTINCT actor_user_id) AS uniqueActors,
    DATE_FORMAT(MAX(created_at), '%Y-%m-%dT%H:%i:%s') AS latestAuditAt
  FROM audit_logs
  WHERE created_at >= (UTC_TIMESTAMP() - INTERVAL 7 DAY);

  SELECT
    id,
    request_id AS requestId,
    action_method AS actionMethod,
    resource_path AS resourcePath,
    route_pattern AS routePattern,
    target_id AS targetId,
    outcome,
    status_code AS statusCode,
    duration_ms AS durationMs,
    actor_user_id AS actorUserId,
    actor_role AS actorRole,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS createdAt
  FROM audit_logs
  ORDER BY created_at DESC, id DESC
  LIMIT v_limit;
END$$

CREATE PROCEDURE sp_admin_violation_dashboard(IN p_limit INT)
BEGIN
  DECLARE v_limit INT DEFAULT 200;

  SET v_limit = COALESCE(p_limit, 200);
  IF v_limit < 1 THEN
    SET v_limit = 1;
  END IF;
  IF v_limit > 500 THEN
    SET v_limit = 500;
  END IF;

  SELECT
    COUNT(*) AS totalViolations,
    COUNT(DISTINCT CONCAT(exam_id, ':', student_id)) AS impactedStudents,
    COALESCE(SUM(CASE WHEN violation_type = 'auto_submitted' THEN 1 ELSE 0 END), 0) AS autoSubmittedCount,
    DATE_FORMAT(MAX(occurred_at), '%Y-%m-%dT%H:%i:%s') AS latestViolationAt
  FROM exam_violations;

  SELECT
    COUNT(*) AS totalCases,
    COALESCE(SUM(CASE WHEN outcome = 'pending' THEN 1 ELSE 0 END), 0) AS pendingCases,
    COALESCE(SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END), 0) AS elevatedCases
  FROM violation_cases;

  SELECT
    ev.exam_id AS examId,
    COALESCE(e.title, ev.exam_id) AS examTitle,
    c.name AS className,
    ev.student_id AS studentId,
    COALESCE(u.name, ev.student_id) AS studentName,
    u.email AS studentEmail,
    COUNT(*) AS violationCount,
    DATE_FORMAT(MIN(ev.occurred_at), '%Y-%m-%dT%H:%i:%s') AS firstOccurredAt,
    DATE_FORMAT(MAX(ev.occurred_at), '%Y-%m-%dT%H:%i:%s') AS lastOccurredAt,
    latest.violation_type AS latestType,
    latest.details AS latestDetails,
    vc.id AS caseId,
    vc.severity,
    vc.outcome,
    vc.teacher_notes AS teacherNotes,
    vc.reviewed_by AS reviewedBy,
    rv.name AS reviewerName,
    DATE_FORMAT(vc.reviewed_at, '%Y-%m-%dT%H:%i:%s') AS reviewedAt,
    DATE_FORMAT(vc.created_ts, '%Y-%m-%dT%H:%i:%s') AS createdAt,
    DATE_FORMAT(vc.updated_ts, '%Y-%m-%dT%H:%i:%s') AS updatedAt
  FROM exam_violations ev
  LEFT JOIN (
    SELECT ev_latest.*
    FROM exam_violations ev_latest
    INNER JOIN (
      SELECT exam_id, student_id, MAX(id) AS latest_id
      FROM exam_violations
      GROUP BY exam_id, student_id
    ) latest_id
      ON latest_id.latest_id = ev_latest.id
  ) latest
    ON latest.exam_id = ev.exam_id
   AND latest.student_id = ev.student_id
  LEFT JOIN violation_cases vc
    ON vc.exam_id = ev.exam_id
   AND vc.student_id = ev.student_id
  LEFT JOIN examhub.exams e ON e.id = ev.exam_id
  LEFT JOIN examhub.classes c ON c.id = e.class_id
  LEFT JOIN examhub.users u ON u.id = ev.student_id
  LEFT JOIN examhub.users rv ON rv.id = vc.reviewed_by
  GROUP BY
    ev.exam_id,
    e.title,
    c.name,
    ev.student_id,
    u.name,
    u.email,
    latest.violation_type,
    latest.details,
    vc.id,
    vc.severity,
    vc.outcome,
    vc.teacher_notes,
    vc.reviewed_by,
    rv.name,
    vc.reviewed_at,
    vc.created_ts,
    vc.updated_ts
  ORDER BY
    CASE COALESCE(vc.outcome, 'pending')
      WHEN 'pending' THEN 0
      WHEN 'warned' THEN 1
      WHEN 'score_penalized' THEN 2
      WHEN 'invalidated' THEN 3
      ELSE 4
    END,
    MAX(ev.occurred_at) DESC
  LIMIT v_limit;
END$$

DELIMITER ;
