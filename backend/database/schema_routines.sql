-- Online Examination System Backend (MySQL 8+)
-- All runtime data access from PHP must call these routines only.

CREATE DATABASE IF NOT EXISTS examhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE examhub;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  department_enc TEXT NULL,
  phone_enc TEXT NULL,
  bio_enc TEXT NULL,
  joined_at DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
  id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  code VARCHAR(32) NOT NULL,
  description TEXT NULL,
  created_at DATE NOT NULL,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_classes_code (code),
  CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_students (
  class_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  joined_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, student_id),
  CONSTRAINT fk_class_students_class FOREIGN KEY (class_id) REFERENCES classes(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_class_students_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exams (
  id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  class_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  duration_minutes INT NOT NULL,
  total_marks INT NOT NULL,
  passing_marks INT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('draft', 'published', 'completed') NOT NULL,
  questions_json JSON NOT NULL,
  created_at DATE NOT NULL,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exams_class_id (class_id),
  KEY idx_exams_teacher_id (teacher_id),
  CONSTRAINT fk_exams_class FOREIGN KEY (class_id) REFERENCES classes(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_exams_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) NOT NULL,
  exam_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  answers_json JSON NOT NULL,
  total_score DECIMAL(8,2) NULL,
  percentage DECIMAL(6,2) NULL,
  grade VARCHAR(8) NULL,
  feedback_enc TEXT NULL,
  submitted_at DATETIME NOT NULL,
  graded_at DATETIME NULL,
  status ENUM('submitted', 'graded') NOT NULL,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_submissions_exam_student (exam_id, student_id),
  KEY idx_submissions_student (student_id),
  CONSTRAINT fk_submissions_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  issued_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user_id (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_seed_core_accounts;
DROP PROCEDURE IF EXISTS sp_seed_demo_data;
DROP PROCEDURE IF EXISTS sp_auth_register;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_email;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_id;
DROP PROCEDURE IF EXISTS sp_auth_get_user_by_session;
DROP PROCEDURE IF EXISTS sp_session_create;
DROP PROCEDURE IF EXISTS sp_session_revoke;
DROP PROCEDURE IF EXISTS sp_users_get_all;
DROP PROCEDURE IF EXISTS sp_users_create;
DROP PROCEDURE IF EXISTS sp_users_update_admin;
DROP PROCEDURE IF EXISTS sp_users_update_profile;
DROP PROCEDURE IF EXISTS sp_users_delete;
DROP PROCEDURE IF EXISTS sp_classes_get_all;
DROP PROCEDURE IF EXISTS sp_classes_get_by_id;
DROP PROCEDURE IF EXISTS sp_classes_get_by_code;
DROP PROCEDURE IF EXISTS sp_classes_create;
DROP PROCEDURE IF EXISTS sp_classes_update;
DROP PROCEDURE IF EXISTS sp_classes_delete;
DROP PROCEDURE IF EXISTS sp_classes_enroll_student;
DROP PROCEDURE IF EXISTS sp_classes_remove_student;
DROP PROCEDURE IF EXISTS sp_exams_get_for_user;
DROP PROCEDURE IF EXISTS sp_exams_get_by_id_for_user;
DROP PROCEDURE IF EXISTS sp_exams_get_by_id;
DROP PROCEDURE IF EXISTS sp_exams_create;
DROP PROCEDURE IF EXISTS sp_exams_update;
DROP PROCEDURE IF EXISTS sp_exams_delete;
DROP PROCEDURE IF EXISTS sp_results_submit;
DROP PROCEDURE IF EXISTS sp_results_get_by_student_for_user;
DROP PROCEDURE IF EXISTS sp_results_get_by_id_for_user;
DROP PROCEDURE IF EXISTS sp_results_grade_update;
DROP PROCEDURE IF EXISTS sp_admin_get_exams_overview;
DROP PROCEDURE IF EXISTS sp_admin_get_results_overview;
DROP PROCEDURE IF EXISTS sp_reports_exam_performance;
DROP PROCEDURE IF EXISTS sp_reports_pass_fail;
DROP PROCEDURE IF EXISTS sp_data_all;
DROP PROCEDURE IF EXISTS sp_data_reset;

DELIMITER $$

CREATE PROCEDURE sp_seed_core_accounts(
    IN p_admin_id CHAR(36),
    IN p_admin_name VARCHAR(150),
    IN p_admin_email VARCHAR(191),
    IN p_admin_password_hash VARCHAR(255),
    IN p_admin_department_enc TEXT,
    IN p_teacher_id CHAR(36),
    IN p_teacher_name VARCHAR(150),
    IN p_teacher_email VARCHAR(191),
    IN p_teacher_password_hash VARCHAR(255),
    IN p_teacher_department_enc TEXT,
    IN p_student_id CHAR(36),
    IN p_student_name VARCHAR(150),
    IN p_student_email VARCHAR(191),
    IN p_student_password_hash VARCHAR(255),
    IN p_student_department_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_admin_email LIMIT 1) THEN
        INSERT INTO users (id, name, email, password_hash, role, department_enc, joined_at)
        VALUES (p_admin_id, p_admin_name, p_admin_email, p_admin_password_hash, 'admin', p_admin_department_enc, p_joined_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_teacher_email LIMIT 1) THEN
        INSERT INTO users (id, name, email, password_hash, role, department_enc, joined_at)
        VALUES (p_teacher_id, p_teacher_name, p_teacher_email, p_teacher_password_hash, 'teacher', p_teacher_department_enc, p_joined_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE email = p_student_email LIMIT 1) THEN
        INSERT INTO users (id, name, email, password_hash, role, department_enc, joined_at)
        VALUES (p_student_id, p_student_name, p_student_email, p_student_password_hash, 'student', p_student_department_enc, p_joined_at);
    END IF;
END$$

CREATE PROCEDURE sp_seed_demo_data(
    IN p_class_id CHAR(36),
    IN p_class_name VARCHAR(150),
    IN p_subject VARCHAR(150),
    IN p_teacher_id CHAR(36),
    IN p_code VARCHAR(32),
    IN p_description TEXT,
    IN p_created_at DATE,
    IN p_student_id CHAR(36),
    IN p_exam_id CHAR(36),
    IN p_exam_title VARCHAR(255),
    IN p_exam_description TEXT,
    IN p_exam_class_id CHAR(36),
    IN p_exam_teacher_id CHAR(36),
    IN p_duration INT,
    IN p_total_marks INT,
    IN p_passing_marks INT,
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_status VARCHAR(32),
    IN p_questions_json JSON,
    IN p_exam_created_at DATE
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM classes WHERE id = p_class_id LIMIT 1) THEN
        INSERT INTO classes (id, name, subject, teacher_id, code, description, created_at)
        VALUES (p_class_id, p_class_name, p_subject, p_teacher_id, p_code, p_description, p_created_at);
    END IF;

    INSERT IGNORE INTO class_students (class_id, student_id)
    VALUES (p_class_id, p_student_id);

    IF NOT EXISTS (SELECT 1 FROM exams WHERE id = p_exam_id LIMIT 1) THEN
        INSERT INTO exams (
            id, title, description, class_id, teacher_id,
            duration_minutes, total_marks, passing_marks,
            start_date, end_date, status, questions_json, created_at
        ) VALUES (
            p_exam_id, p_exam_title, p_exam_description, p_exam_class_id, p_exam_teacher_id,
            p_duration, p_total_marks, p_passing_marks,
            p_start_date, p_end_date, p_status, p_questions_json, p_exam_created_at
        );
    END IF;
END$$

CREATE PROCEDURE sp_auth_register(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_email VARCHAR(191),
    IN p_password_hash VARCHAR(255),
    IN p_role VARCHAR(32),
    IN p_department_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email LIMIT 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EMAIL_EXISTS';
    END IF;

    INSERT INTO users (id, name, email, password_hash, role, department_enc, joined_at)
    VALUES (p_id, p_name, p_email, p_password_hash, p_role, p_department_enc, p_joined_at);

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = p_token_hash
      AND s.revoked_at IS NULL
      AND s.expires_at > UTC_TIMESTAMP()
    LIMIT 1;
END$$

CREATE PROCEDURE sp_session_create(
    IN p_id CHAR(36),
    IN p_user_id CHAR(36),
    IN p_token_hash CHAR(64),
    IN p_issued_at DATETIME,
    IN p_expires_at DATETIME
)
BEGIN
    INSERT INTO sessions (id, user_id, token_hash, issued_at, expires_at)
    VALUES (p_id, p_user_id, p_token_hash, p_issued_at, p_expires_at)
    ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        issued_at = VALUES(issued_at),
        expires_at = VALUES(expires_at),
        revoked_at = NULL;
END$$

CREATE PROCEDURE sp_session_revoke(IN p_token_hash CHAR(64))
BEGIN
    UPDATE sessions
    SET revoked_at = UTC_TIMESTAMP()
    WHERE token_hash = p_token_hash
      AND revoked_at IS NULL;
END$$

CREATE PROCEDURE sp_users_get_all()
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
    IN p_department_enc TEXT,
    IN p_phone_enc TEXT,
    IN p_bio_enc TEXT,
    IN p_joined_at DATE
)
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email LIMIT 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EMAIL_EXISTS';
    END IF;

    INSERT INTO users (
        id, name, email, password_hash, role,
        department_enc, phone_enc, bio_enc, joined_at
    ) VALUES (
        p_id, p_name, p_email, p_password_hash, p_role,
        p_department_enc, p_phone_enc, p_bio_enc, p_joined_at
    );

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
    IN p_department_enc TEXT,
    IN p_phone_enc TEXT,
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
        department_enc = p_department_enc,
        phone_enc = p_phone_enc,
        bio_enc = p_bio_enc,
        joined_at = p_joined_at
    WHERE id = p_id;

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_users_update_profile(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_department_enc TEXT,
    IN p_phone_enc TEXT,
    IN p_bio_enc TEXT
)
BEGIN
    UPDATE users
    SET
        name = p_name,
        department_enc = p_department_enc,
        phone_enc = p_phone_enc,
        bio_enc = p_bio_enc
    WHERE id = p_id;

    SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash AS passwordHash,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
        u.bio_enc AS bioEnc,
        DATE_FORMAT(u.joined_at, '%Y-%m-%d') AS joinedAt
    FROM users u
    WHERE u.id = p_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_users_delete(IN p_id CHAR(36))
BEGIN
    DELETE FROM users WHERE id = p_id;
END$$

CREATE PROCEDURE sp_classes_get_all()
BEGIN
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
END$$

CREATE PROCEDURE sp_classes_get_by_id(IN p_class_id CHAR(36))
BEGIN
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
    WHERE c.id = p_class_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_classes_get_by_code(IN p_code VARCHAR(32))
BEGIN
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
    WHERE UPPER(c.code) = UPPER(p_code)
    LIMIT 1;
END$$

CREATE PROCEDURE sp_classes_create(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_subject VARCHAR(150),
    IN p_teacher_id CHAR(36),
    IN p_code VARCHAR(32),
    IN p_description TEXT,
    IN p_created_at DATE
)
BEGIN
    INSERT INTO classes (id, name, subject, teacher_id, code, description, created_at)
    VALUES (p_id, p_name, p_subject, p_teacher_id, p_code, p_description, p_created_at);

    CALL sp_classes_get_by_id(p_id);
END$$

CREATE PROCEDURE sp_classes_update(
    IN p_id CHAR(36),
    IN p_name VARCHAR(150),
    IN p_subject VARCHAR(150),
    IN p_teacher_id CHAR(36),
    IN p_code VARCHAR(32),
    IN p_description TEXT
)
BEGIN
    UPDATE classes
    SET
        name = p_name,
        subject = p_subject,
        teacher_id = p_teacher_id,
        code = p_code,
        description = p_description
    WHERE id = p_id;

    CALL sp_classes_get_by_id(p_id);
END$$

CREATE PROCEDURE sp_classes_delete(IN p_id CHAR(36))
BEGIN
    DELETE FROM classes WHERE id = p_id;
END$$

CREATE PROCEDURE sp_classes_enroll_student(
    IN p_class_id CHAR(36),
    IN p_student_id CHAR(36)
)
BEGIN
    INSERT IGNORE INTO class_students (class_id, student_id)
    VALUES (p_class_id, p_student_id);
END$$

CREATE PROCEDURE sp_classes_remove_student(
    IN p_class_id CHAR(36),
    IN p_student_id CHAR(36)
)
BEGIN
    DELETE FROM class_students
    WHERE class_id = p_class_id
      AND student_id = p_student_id;
END$$

CREATE PROCEDURE sp_exams_get_for_user(
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    IF p_role = 'admin' THEN
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
    ELSEIF p_role = 'teacher' THEN
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
        WHERE e.teacher_id = p_user_id
        ORDER BY e.created_ts DESC;
    ELSE
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
        WHERE EXISTS (
            SELECT 1
            FROM class_students cs
            WHERE cs.class_id = e.class_id
              AND cs.student_id = p_user_id
        )
        ORDER BY e.created_ts DESC;
    END IF;
END$$

CREATE PROCEDURE sp_exams_get_by_id_for_user(
    IN p_exam_id CHAR(36),
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    IF p_role = 'admin' THEN
        CALL sp_exams_get_by_id(p_exam_id);
    ELSEIF p_role = 'teacher' THEN
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
        WHERE e.id = p_exam_id
          AND e.teacher_id = p_user_id
        LIMIT 1;
    ELSE
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
        WHERE e.id = p_exam_id
          AND EXISTS (
              SELECT 1
              FROM class_students cs
              WHERE cs.class_id = e.class_id
                AND cs.student_id = p_user_id
          )
        LIMIT 1;
    END IF;
END$$

CREATE PROCEDURE sp_exams_get_by_id(IN p_exam_id CHAR(36))
BEGIN
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
    WHERE e.id = p_exam_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_exams_create(
    IN p_id CHAR(36),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_class_id CHAR(36),
    IN p_teacher_id CHAR(36),
    IN p_duration INT,
    IN p_total_marks INT,
    IN p_passing_marks INT,
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_status VARCHAR(32),
    IN p_questions_json JSON,
    IN p_created_at DATE
)
BEGIN
    INSERT INTO exams (
        id, title, description, class_id, teacher_id,
        duration_minutes, total_marks, passing_marks,
        start_date, end_date, status, questions_json, created_at
    ) VALUES (
        p_id, p_title, p_description, p_class_id, p_teacher_id,
        p_duration, p_total_marks, p_passing_marks,
        p_start_date, p_end_date, p_status, p_questions_json, p_created_at
    );

    CALL sp_exams_get_by_id(p_id);
END$$

CREATE PROCEDURE sp_exams_update(
    IN p_id CHAR(36),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_class_id CHAR(36),
    IN p_teacher_id CHAR(36),
    IN p_duration INT,
    IN p_total_marks INT,
    IN p_passing_marks INT,
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_status VARCHAR(32),
    IN p_questions_json JSON
)
BEGIN
    UPDATE exams
    SET
        title = p_title,
        description = p_description,
        class_id = p_class_id,
        teacher_id = p_teacher_id,
        duration_minutes = p_duration,
        total_marks = p_total_marks,
        passing_marks = p_passing_marks,
        start_date = p_start_date,
        end_date = p_end_date,
        status = p_status,
        questions_json = p_questions_json
    WHERE id = p_id;

    CALL sp_exams_get_by_id(p_id);
END$$

CREATE PROCEDURE sp_exams_delete(IN p_id CHAR(36))
BEGIN
    DELETE FROM exams WHERE id = p_id;
END$$

CREATE PROCEDURE sp_results_submit(
    IN p_id CHAR(36),
    IN p_exam_id CHAR(36),
    IN p_student_id CHAR(36),
    IN p_answers_json JSON,
    IN p_total_score DECIMAL(8,2),
    IN p_percentage DECIMAL(6,2),
    IN p_grade VARCHAR(8),
    IN p_feedback_enc TEXT,
    IN p_submitted_at DATETIME,
    IN p_graded_at DATETIME,
    IN p_status VARCHAR(32)
)
BEGIN
    INSERT INTO submissions (
        id, exam_id, student_id, answers_json, total_score,
        percentage, grade, feedback_enc, submitted_at, graded_at, status
    ) VALUES (
        p_id, p_exam_id, p_student_id, p_answers_json, p_total_score,
        p_percentage, p_grade, p_feedback_enc, p_submitted_at, p_graded_at, p_status
    )
    ON DUPLICATE KEY UPDATE
        answers_json = VALUES(answers_json),
        total_score = VALUES(total_score),
        percentage = VALUES(percentage),
        grade = VALUES(grade),
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
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status
    FROM submissions s
    WHERE s.id = p_submission_id
    LIMIT 1;
END$$

CREATE PROCEDURE sp_admin_get_exams_overview()
BEGIN
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
        DATE_FORMAT(e.created_at, '%Y-%m-%d') AS createdAt,
        COUNT(s.id) AS submissionCount,
        IFNULL(ROUND(AVG(s.percentage), 2), 0) AS averageScore
    FROM exams e
    LEFT JOIN submissions s ON s.exam_id = e.id
    GROUP BY e.id
    ORDER BY e.created_ts DESC;
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

CREATE PROCEDURE sp_reports_exam_performance(
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    IF p_role = 'admin' THEN
        SELECT
            e.id AS examId,
            e.title AS examTitle,
            e.class_id AS classId,
            c.name AS className,
            COUNT(s.id) AS totalSubmissions,
            IFNULL(ROUND(AVG(s.percentage), 2), 0) AS averageScore,
            IFNULL(MAX(s.percentage), 0) AS highestScore,
            IFNULL(MIN(s.percentage), 0) AS lowestScore,
            SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) AS passCount,
            SUM(CASE WHEN s.id IS NOT NULL AND s.total_score < e.passing_marks THEN 1 ELSE 0 END) AS failCount
        FROM exams e
        INNER JOIN classes c ON c.id = e.class_id
        LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'graded'
        GROUP BY e.id, e.title, e.class_id, c.name
        ORDER BY e.created_ts DESC;
    ELSE
        SELECT
            e.id AS examId,
            e.title AS examTitle,
            e.class_id AS classId,
            c.name AS className,
            COUNT(s.id) AS totalSubmissions,
            IFNULL(ROUND(AVG(s.percentage), 2), 0) AS averageScore,
            IFNULL(MAX(s.percentage), 0) AS highestScore,
            IFNULL(MIN(s.percentage), 0) AS lowestScore,
            SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) AS passCount,
            SUM(CASE WHEN s.id IS NOT NULL AND s.total_score < e.passing_marks THEN 1 ELSE 0 END) AS failCount
        FROM exams e
        INNER JOIN classes c ON c.id = e.class_id
        LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'graded'
        WHERE e.teacher_id = p_user_id
        GROUP BY e.id, e.title, e.class_id, c.name
        ORDER BY e.created_ts DESC;
    END IF;
END$$

CREATE PROCEDURE sp_reports_pass_fail(
    IN p_role VARCHAR(32),
    IN p_user_id CHAR(36)
)
BEGIN
    DROP TEMPORARY TABLE IF EXISTS tmp_exam_scope;

    CREATE TEMPORARY TABLE tmp_exam_scope
    SELECT e.*
    FROM exams e
    WHERE (p_role = 'admin') OR (p_role = 'teacher' AND e.teacher_id = p_user_id);

    SELECT
        COUNT(s.id) AS total,
        SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN s.id IS NOT NULL AND s.total_score < e.passing_marks THEN 1 ELSE 0 END) AS failed,
        IFNULL(ROUND(100 * SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) / NULLIF(COUNT(s.id), 0), 2), 0) AS passRate
    FROM submissions s
    INNER JOIN tmp_exam_scope e ON e.id = s.exam_id
    WHERE s.status = 'graded';

    SELECT
        e.id AS examId,
        e.title AS examTitle,
        SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN s.id IS NOT NULL AND s.total_score < e.passing_marks THEN 1 ELSE 0 END) AS failed,
        IFNULL(ROUND(100 * SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) / NULLIF(COUNT(s.id), 0), 2), 0) AS passRate
    FROM tmp_exam_scope e
    LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'graded'
    GROUP BY e.id, e.title
    ORDER BY e.created_ts DESC;

    SELECT
        c.id AS classId,
        c.name AS className,
        SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN s.id IS NOT NULL AND s.total_score < e.passing_marks THEN 1 ELSE 0 END) AS failed,
        IFNULL(ROUND(100 * SUM(CASE WHEN s.total_score >= e.passing_marks THEN 1 ELSE 0 END) / NULLIF(COUNT(s.id), 0), 2), 0) AS passRate
    FROM classes c
    INNER JOIN tmp_exam_scope e ON e.class_id = c.id
    LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'graded'
    GROUP BY c.id, c.name
    ORDER BY c.created_ts DESC;

    DROP TEMPORARY TABLE IF EXISTS tmp_exam_scope;
END$$

CREATE PROCEDURE sp_data_all()
BEGIN
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.department_enc AS departmentEnc,
        u.phone_enc AS phoneEnc,
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
        s.feedback_enc AS feedbackEnc,
        DATE_FORMAT(s.submitted_at, '%Y-%m-%dT%H:%i:%s') AS submittedAt,
        IFNULL(DATE_FORMAT(s.graded_at, '%Y-%m-%dT%H:%i:%s'), NULL) AS gradedAt,
        s.status
    FROM submissions s
    ORDER BY s.created_ts DESC;
END$$

CREATE PROCEDURE sp_data_reset()
BEGIN
    DELETE FROM sessions;
    DELETE FROM submissions;
    DELETE FROM class_students;
    DELETE FROM exams;
    DELETE FROM classes;
    DELETE FROM users;
END$$

DELIMITER ;

-- Seed logic is intentionally implemented via stored procedure `sp_seed_core_accounts`.
-- Runtime values are supplied by backend environment variables, not hardcoded SQL literals.
