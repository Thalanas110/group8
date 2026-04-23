-- Add-on schema for strict AES-256-GCM storage compliance.
-- Run this AFTER importing app_001_schema_routines.sql.
-- Then run the repair script to convert legacy combined-string records.

USE examhub;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS department_ciphertext TEXT NULL AFTER role,
    ADD COLUMN IF NOT EXISTS department_iv VARCHAR(24) NULL AFTER department_ciphertext,
    ADD COLUMN IF NOT EXISTS department_tag VARCHAR(24) NULL AFTER department_iv,
    ADD COLUMN IF NOT EXISTS phone_ciphertext TEXT NULL AFTER department_enc,
    ADD COLUMN IF NOT EXISTS phone_iv VARCHAR(24) NULL AFTER phone_ciphertext,
    ADD COLUMN IF NOT EXISTS phone_tag VARCHAR(24) NULL AFTER phone_iv,
    ADD COLUMN IF NOT EXISTS bio_ciphertext TEXT NULL AFTER phone_enc,
    ADD COLUMN IF NOT EXISTS bio_iv VARCHAR(24) NULL AFTER bio_ciphertext,
    ADD COLUMN IF NOT EXISTS bio_tag VARCHAR(24) NULL AFTER bio_iv;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS feedback_ciphertext TEXT NULL AFTER grade,
    ADD COLUMN IF NOT EXISTS feedback_iv VARCHAR(24) NULL AFTER feedback_ciphertext,
    ADD COLUMN IF NOT EXISTS feedback_tag VARCHAR(24) NULL AFTER feedback_iv;

DROP PROCEDURE IF EXISTS sp_seed_core_accounts;
DROP PROCEDURE IF EXISTS sp_auth_register;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_email;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_id;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_session;
DROP PROCEDURE IF EXISTS sp_users_get_all;
DROP PROCEDURE IF EXISTS sp_users_create;
DROP PROCEDURE IF EXISTS sp_users_update_admin;
DROP PROCEDURE IF EXISTS sp_users_update_profile;
DROP PROCEDURE IF EXISTS sp_results_submit;
DROP PROCEDURE IF EXISTS sp_results_get_by_student_for_user;
DROP PROCEDURE IF EXISTS sp_results_get_by_id_for_user;
DROP PROCEDURE IF EXISTS sp_results_grade_update;
DROP PROCEDURE IF EXISTS sp_admin_get_results_overview;
DROP PROCEDURE IF EXISTS sp_data_all;
DROP PROCEDURE IF EXISTS sp_encryption_get_legacy_users;
DROP PROCEDURE IF EXISTS sp_encryption_repair_user;
DROP PROCEDURE IF EXISTS sp_encryption_get_legacy_submissions;
DROP PROCEDURE IF EXISTS sp_encryption_repair_submission;

DELIMITER $$

CREATE PROCEDURE sp_seed_core_accounts(
    IN p_admin_id CHAR(36),
    IN p_admin_name VARCHAR(150),
    IN p_admin_email VARCHAR(191),
    IN p_admin_password_hash VARCHAR(255),
    IN p_admin_department_ciphertext TEXT,
    IN p_admin_department_iv VARCHAR(24),
    IN p_admin_department_tag VARCHAR(24),
    IN p_admin_department_enc TEXT,
    IN p_teacher_id CHAR(36),
    IN p_teacher_name VARCHAR(150),
    IN p_teacher_email VARCHAR(191),
    IN p_teacher_password_hash VARCHAR(255),
    IN p_teacher_department_ciphertext TEXT,
    IN p_teacher_department_iv VARCHAR(24),
    IN p_teacher_department_tag VARCHAR(24),
    IN p_teacher_department_enc TEXT,
    IN p_student_id CHAR(36),
    IN p_student_name VARCHAR(150),
    IN p_student_email VARCHAR(191),
    IN p_student_password_hash VARCHAR(255),
    IN p_student_department_ciphertext TEXT,
    IN p_student_department_iv VARCHAR(24),
    IN p_student_department_tag VARCHAR(24),
    IN p_student_department_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_admin_email LIMIT 1) THEN
        INSERT INTO users (
            id, name, email, password_hash, role,
            department_ciphertext, department_iv, department_tag, department_enc,
            joined_at
        )
        VALUES (
            p_admin_id, p_admin_name, p_admin_email, p_admin_password_hash, 'admin',
            p_admin_department_ciphertext, p_admin_department_iv, p_admin_department_tag, p_admin_department_enc,
            p_joined_at
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_teacher_email LIMIT 1) THEN
        INSERT INTO users (
            id, name, email, password_hash, role,
            department_ciphertext, department_iv, department_tag, department_enc,
            joined_at
        )
        VALUES (
            p_teacher_id, p_teacher_name, p_teacher_email, p_teacher_password_hash, 'teacher',
            p_teacher_department_ciphertext, p_teacher_department_iv, p_teacher_department_tag, p_teacher_department_enc,
            p_joined_at
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_student_email LIMIT 1) THEN
        INSERT INTO users (
            id, name, email, password_hash, role,
            department_ciphertext, department_iv, department_tag, department_enc,
            joined_at
        )
        VALUES (
            p_student_id, p_student_name, p_student_email, p_student_password_hash, 'student',
            p_student_department_ciphertext, p_student_department_iv, p_student_department_tag, p_student_department_enc,
            p_joined_at
        );
    END IF;
END$$

CREATE PROCEDURE sp_auth_register(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_email VARCHAR(191),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(32),
    IN p_department_ciphertext TEXT,
    IN p_department_iv VARCHAR(24),
    IN p_department_tag VARCHAR(24),
    IN p_department_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email LIMIT 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EMAIL_EXISTS';
    END IF;

    INSERT INTO users (
        id, name, email, password_hash, role,
        department_ciphertext, department_iv, department_tag, department_enc,
        joined_at
    )
    VALUES (
        p_id, p_name, p_email, p_password_hash, p_role,
        p_department_ciphertext, p_department_iv, p_department_tag, p_department_enc,
        p_joined_at
    );

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_auth_get_user_by_email(IN p_email VARCHAR(191))
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.email = p_email
    LIMIT 1;
END$$

CREATE PROCEDURE sp_auth_get_user_by_id(IN p_user_id CHAR(36))
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_user_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_auth_get_user_by_session(IN p_token_hash CHAR(64))
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = p_token_hash
      AND s.revoked_at IS NULL
      AND s.expires_at > UTC_TIMESTAMP()
    LIMIT 1;
END$$

CREATE PROCEDURE sp_users_get_all()
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    ORDER BY u.created_at ASC;
END$$

CREATE PROCEDURE sp_users_create(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_email VARCHAR(191),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(32),
    IN p_department_ciphertext TEXT,
    IN p_department_iv VARCHAR(24),
    IN p_department_tag VARCHAR(24),
    IN p_department_enc TEXT,
    IN p_phone_ciphertext TEXT,
    IN p_phone_iv VARCHAR(24),
    IN p_phone_tag VARCHAR(24),
    IN p_phone_enc TEXT,
    IN p_bio_ciphertext TEXT,
    IN p_bio_iv VARCHAR(24),
    IN p_bio_tag VARCHAR(24),
    IN p_bio_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email LIMIT 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EMAIL_EXISTS';
    END IF;

    INSERT INTO users (
        id, name, email, password_hash, role,
        department_ciphertext, department_iv, department_tag, department_enc,
        phone_ciphertext, phone_iv, phone_tag, phone_enc,
        bio_ciphertext, bio_iv, bio_tag, bio_enc,
        joined_at
    ) VALUES (
        p_id, p_name, p_email, p_password_hash, p_role,
        p_department_ciphertext, p_department_iv, p_department_tag, p_department_enc,
        p_phone_ciphertext, p_phone_iv, p_phone_tag, p_phone_enc,
        p_bio_ciphertext, p_bio_iv, p_bio_tag, p_bio_enc,
        p_joined_at
    );

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_users_update_admin(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_email VARCHAR(191),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(32),
    IN p_department_ciphertext TEXT,
    IN p_department_iv VARCHAR(24),
    IN p_department_tag VARCHAR(24),
    IN p_department_enc TEXT,
    IN p_phone_ciphertext TEXT,
    IN p_phone_iv VARCHAR(24),
    IN p_phone_tag VARCHAR(24),
    IN p_phone_enc TEXT,
    IN p_bio_ciphertext TEXT,
    IN p_bio_iv VARCHAR(24),
    IN p_bio_tag VARCHAR(24),
    IN p_bio_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    UPDATE users
    SET
        name = p_name,
        email = p_email,
        password_hash = p_password_hash,
        role = p_role,
        department_ciphertext = p_department_ciphertext,
        department_iv = p_department_iv,
        department_tag = p_department_tag,
        department_enc = p_department_enc,
        phone_ciphertext = p_phone_ciphertext,
        phone_iv = p_phone_iv,
        phone_tag = p_phone_tag,
        phone_enc = p_phone_enc,
        bio_ciphertext = p_bio_ciphertext,
        bio_iv = p_bio_iv,
        bio_tag = p_bio_tag,
        bio_enc = p_bio_enc,
        joined_at = p_joined_at
    WHERE id = p_id;

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_users_update_profile(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_department_ciphertext TEXT,
    IN p_department_iv VARCHAR(24),
    IN p_department_tag VARCHAR(24),
    IN p_department_enc TEXT,
    IN p_phone_ciphertext TEXT,
    IN p_phone_iv VARCHAR(24),
    IN p_phone_tag VARCHAR(24),
    IN p_phone_enc TEXT,
    IN p_bio_ciphertext TEXT,
    IN p_bio_iv VARCHAR(24),
    IN p_bio_tag VARCHAR(24),
    IN p_bio_enc TEXT
)
BEGIN
    UPDATE users
    SET
        name = p_name,
        department_ciphertext = p_department_ciphertext,
        department_iv = p_department_iv,
        department_tag = p_department_tag,
        department_enc = p_department_enc,
        phone_ciphertext = p_phone_ciphertext,
        phone_iv = p_phone_iv,
        phone_tag = p_phone_tag,
        phone_enc = p_phone_enc,
        bio_ciphertext = p_bio_ciphertext,
        bio_iv = p_bio_iv,
        bio_tag = p_bio_tag,
        bio_enc = p_bio_enc
    WHERE id = p_id;

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_results_submit(
    IN p_id CHAR(36),
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36),
    IN p_answers_json JSON,
    IN p_total_score DECIMAL(8,2),
    IN p_percentage DECIMAL(6,2),
    IN p_grade VARCHAR(8),
    IN p_feedback_ciphertext TEXT,
    IN p_feedback_iv VARCHAR(24),
    IN p_feedback_tag VARCHAR(24),
    IN p_feedback_enc TEXT,
    IN p_submitted_at DATETIME,
    IN p_graded_at DATETIME,
    IN p_status VARCHAR(32)
)
BEGIN
    INSERT INTO submissions (
        id, exam_id, student_id, answers_json, total_score,
        percentage, grade, feedback_ciphertext, feedback_iv, feedback_tag, feedback_enc,
        submitted_at, graded_at, status
    ) VALUES (
        p_id, p_exam_id, p_student_id, p_answers_json, p_total_score,
        p_percentage, p_grade, p_feedback_ciphertext, p_feedback_iv, p_feedback_tag, p_feedback_enc,
        p_submitted_at, p_graded_at, p_status
    )
    ON DUPLICATE KEY UPDATE
        answers_json = VALUES(answers_json),
        total_score = VALUES(total_score),
        percentage = VALUES(percentage),
        grade = VALUES(grade),
        feedback_ciphertext = VALUES(feedback_ciphertext),
        feedback_iv = VALUES(feedback_iv),
        feedback_tag = VALUES(feedback_tag),
        feedback_enc = VALUES(feedback_enc),
        submitted_at = VALUES(submitted_at),
        graded_at = VALUES(graded_at),
        status = VALUES(status);

    SELECT
        s.id,
        s.exam_id AS examId,
        s.student_id AS studentId,
        s.answers_json AS answers,
        s.total_score AS totalScore,
        s.percentage,
        s.grade,
        s.feedback_ciphertext AS feedbackCiphertext,
        s.feedback_iv AS feedbackIv,
        s.feedback_tag AS feedbackTag,
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status
    FROM submissions s
    WHERE s.exam_id = p_exam_id
      AND s.student_id = p_student_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_results_get_by_student_for_user(
    IN p_student_id CHAR(36),
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    IF p_role = 'admin' THEN
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status
        FROM submissions s
        WHERE s.student_id = p_student_id
        ORDER BY s.created_ts DESC;
    ELSEIF p_role = 'teacher' THEN
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status
        FROM submissions s
        INNER JOIN exams e ON e.id = s.exam_id
        WHERE s.student_id = p_student_id
          AND e.teacher_id = p_user_id
        ORDER BY s.created_ts DESC;
    ELSE
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status
        FROM submissions s
        WHERE s.student_id = p_student_id
          AND s.student_id = p_user_id
        ORDER BY s.created_ts DESC;
    END IF;
END$$

CREATE PROCEDURE sp_results_get_by_id_for_user(
    IN p_submission_id CHAR(36),
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    IF p_role = 'admin' THEN
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status,
            e.total_marks AS totalMarks
        FROM submissions s
        INNER JOIN exams e ON e.id = s.exam_id
        WHERE s.id = p_submission_id
        LIMIT 1;
    ELSEIF p_role = 'teacher' THEN
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status,
            e.total_marks AS totalMarks
        FROM submissions s
        INNER JOIN exams e ON e.id = s.exam_id
        WHERE s.id = p_submission_id
          AND e.teacher_id = p_user_id
        LIMIT 1;
    ELSE
        SELECT
            s.id,
            s.exam_id AS examId,
            s.student_id AS studentId,
            s.answers_json AS answers,
            s.total_score AS totalScore,
            s.percentage,
            s.grade,
            s.feedback_ciphertext AS feedbackCiphertext,
            s.feedback_iv AS feedbackIv,
            s.feedback_tag AS feedbackTag,
            s.feedback_enc AS feedbackEnc,
            DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
            IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
            s.status,
            e.total_marks AS totalMarks
        FROM submissions s
        INNER JOIN exams e ON e.id = s.exam_id
        WHERE s.id = p_submission_id
          AND s.student_id = p_user_id
        LIMIT 1;
    END IF;
END$$

CREATE PROCEDURE sp_results_grade_update(
    IN p_submission_id CHAR(36),
    IN p_answers_json JSON,
    IN p_total_score DECIMAL(8,2),
    IN p_percentage DECIMAL(6,2),
    IN p_grade VARCHAR(8),
    IN p_feedback_ciphertext TEXT,
    IN p_feedback_iv VARCHAR(24),
    IN p_feedback_tag VARCHAR(24),
    IN p_feedback_enc TEXT,
    IN p_graded_at DATETIME,
    IN p_status VARCHAR(32)
)
BEGIN
    UPDATE submissions
    SET
        answers_json = p_answers_json,
        total_score = p_total_score,
        percentage = p_percentage,
        grade = p_grade,
        feedback_ciphertext = p_feedback_ciphertext,
        feedback_iv = p_feedback_iv,
        feedback_tag = p_feedback_tag,
        feedback_enc = p_feedback_enc,
        graded_at = p_graded_at,
        status = p_status
    WHERE id = p_submission_id;

    SELECT
        s.id,
        s.exam_id AS examId,
        s.student_id AS studentId,
        s.answers_json AS answers,
        s.total_score AS totalScore,
        s.percentage,
        s.grade,
        s.feedback_ciphertext AS feedbackCiphertext,
        s.feedback_iv AS feedbackIv,
        s.feedback_tag AS feedbackTag,
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status
    FROM submissions s
    WHERE s.id = p_submission_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_admin_get_results_overview()
BEGIN
    SELECT
        s.id,
        s.exam_id AS examId,
        s.student_id AS studentId,
        s.answers_json AS answers,
        s.total_score AS totalScore,
        s.percentage,
        s.grade,
        s.feedback_ciphertext AS feedbackCiphertext,
        s.feedback_iv AS feedbackIv,
        s.feedback_tag AS feedbackTag,
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status,
        u.name AS studentName,
        e.title AS examTitle
    FROM submissions s
    INNER JOIN users u ON u.id = s.student_id
    INNER JOIN exams e ON e.id = s.exam_id
    ORDER BY s.created_ts DESC;
END$$

CREATE PROCEDURE sp_data_all()
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    ORDER BY u.created_at ASC;

    SELECT
        e.id,
        e.title,
        e.description,
        e.class_id AS classId,
        e.teacher_id AS teacherId,
        e.duration_minutes AS duration,
        e.total_marks AS totalMarks,
        e.passing_marks AS passingMarks,
        DATE_FORMAT(e.start_date, '%Y-%m-%dT%H:%i:%s') AS startDate,
        DATE_FORMAT(e.end_date, '%Y-%m-%dT%H:%i:%s') AS endDate,
        e.status,
        e.questions_json AS questions,
        DATE_FORMAT(e.created_at, '%Y-%m-%d') AS createdAt
    FROM exams e
    ORDER BY e.created_ts DESC;

    SELECT
        c.id,
        c.name,
        c.subject,
        c.teacher_id AS teacherId,
        c.code,
        c.description,
        DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdAt,
        COALESCE(
            (
                SELECT CONCAT(
                    '[',
                    GROUP_CONCAT(JSON_QUOTE(cs.student_id) ORDER BY cs.joined_ts SEPARATOR ','),
                    ']'
                )
                FROM class_students cs
                WHERE cs.class_id = c.id
            ),
            '[]'
        ) AS studentIds
    FROM classes c
    ORDER BY c.created_ts DESC;

    SELECT
        s.id,
        s.exam_id AS examId,
        s.student_id AS studentId,
        s.answers_json AS answers,
        s.total_score AS totalScore,
        s.percentage,
        s.grade,
        s.feedback_ciphertext AS feedbackCiphertext,
        s.feedback_iv AS feedbackIv,
        s.feedback_tag AS feedbackTag,
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status
    FROM submissions s
    ORDER BY s.created_ts DESC;
END$$

CREATE PROCEDURE sp_encryption_get_legacy_users()
BEGIN
    SELECT
        u.id,
        u.department_ciphertext AS departmentCiphertext,
        u.department_iv AS departmentIv,
        u.department_tag AS departmentTag,
        u.department_enc AS departmentEnc,
        u.phone_ciphertext AS phoneCiphertext,
        u.phone_iv AS phoneIv,
        u.phone_tag AS phoneTag,
        u.phone_enc AS phoneEnc,
        u.bio_ciphertext AS bioCiphertext,
        u.bio_iv AS bioIv,
        u.bio_tag AS bioTag,
        u.bio_enc AS bioEnc
    FROM users u
    WHERE
        (u.department_enc IS NOT NULL AND u.department_enc <> '' AND (u.department_ciphertext IS NULL OR u.department_iv IS NULL OR u.department_tag IS NULL))
        OR (u.phone_enc IS NOT NULL AND u.phone_enc <> '' AND (u.phone_ciphertext IS NULL OR u.phone_iv IS NULL OR u.phone_tag IS NULL))
        OR (u.bio_enc IS NOT NULL AND u.bio_enc <> '' AND (u.bio_ciphertext IS NULL OR u.bio_iv IS NULL OR u.bio_tag IS NULL))
    ORDER BY u.created_at ASC;
END$$

CREATE PROCEDURE sp_encryption_repair_user(
    IN p_id CHAR(36),
    IN p_department_ciphertext TEXT,
    IN p_department_iv VARCHAR(24),
    IN p_department_tag VARCHAR(24),
    IN p_department_enc TEXT,
    IN p_phone_ciphertext TEXT,
    IN p_phone_iv VARCHAR(24),
    IN p_phone_tag VARCHAR(24),
    IN p_phone_enc TEXT,
    IN p_bio_ciphertext TEXT,
    IN p_bio_iv VARCHAR(24),
    IN p_bio_tag VARCHAR(24),
    IN p_bio_enc TEXT
)
BEGIN
    UPDATE users
    SET
        department_ciphertext = p_department_ciphertext,
        department_iv = p_department_iv,
        department_tag = p_department_tag,
        department_enc = p_department_enc,
        phone_ciphertext = p_phone_ciphertext,
        phone_iv = p_phone_iv,
        phone_tag = p_phone_tag,
        phone_enc = p_phone_enc,
        bio_ciphertext = p_bio_ciphertext,
        bio_iv = p_bio_iv,
        bio_tag = p_bio_tag,
        bio_enc = p_bio_enc
    WHERE id = p_id;
END$$

CREATE PROCEDURE sp_encryption_get_legacy_submissions()
BEGIN
    SELECT
        s.id,
        s.answers_json AS answers,
        s.feedback_ciphertext AS feedbackCiphertext,
        s.feedback_iv AS feedbackIv,
        s.feedback_tag AS feedbackTag,
        s.feedback_enc AS feedbackEnc
    FROM submissions s
    WHERE
        (s.feedback_enc IS NOT NULL AND s.feedback_enc <> '' AND (s.feedback_ciphertext IS NULL OR s.feedback_iv IS NULL OR s.feedback_tag IS NULL))
        OR CAST(s.answers_json AS CHAR(8192)) LIKE '%"answer"%'
    ORDER BY s.created_ts ASC;
END$$

CREATE PROCEDURE sp_encryption_repair_submission(
    IN p_id CHAR(36),
    IN p_answers_json JSON,
    IN p_feedback_ciphertext TEXT,
    IN p_feedback_iv VARCHAR(24),
    IN p_feedback_tag VARCHAR(24),
    IN p_feedback_enc TEXT
)
BEGIN
    UPDATE submissions
    SET
        answers_json = p_answers_json,
        feedback_ciphertext = p_feedback_ciphertext,
        feedback_iv = p_feedback_iv,
        feedback_tag = p_feedback_tag,
        feedback_enc = p_feedback_enc
    WHERE id = p_id;
END$$

DELIMITER ;
