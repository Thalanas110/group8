# Backend API Documentation

Repository: https://github.com/Thalanas110/group8

## Overview

- Project: ExamHub backend API
- Stack: Vanilla PHP 8+, MySQL/MariaDB, JSON REST API
- Authentication: Custom JWT plus persisted token sessions
- Base API path: `/api`

## Instructor Compliance Summary

- Uses vanilla PHP, not Laravel/Slim/etc.
- Returns JSON responses with proper HTTP status codes.
- Uses MySQL/MariaDB with group-designed schema.
- Validates input and returns structured API errors.
- Hashes passwords with `password_hash()`.
- Encrypts sensitive data with AES-256-GCM using `openssl_encrypt()` and `openssl_decrypt()`.

## AES-256-GCM Compliance

### Encrypted Fields

- User department:
  - `users.department_ciphertext`
  - `users.department_iv`
  - `users.department_tag`
- User phone:
  - `users.phone_ciphertext`
  - `users.phone_iv`
  - `users.phone_tag`
- User bio:
  - `users.bio_ciphertext`
  - `users.bio_iv`
  - `users.bio_tag`
- Exam answers:
  - `submissions.answers_json[*].answerCiphertext`
  - `submissions.answers_json[*].answerIv`
  - `submissions.answers_json[*].answerTag`
- Submission feedback:
  - `submissions.feedback_ciphertext`
  - `submissions.feedback_iv`
  - `submissions.feedback_tag`
- Accessibility preferences:
  - `student_exam_accommodations.accessibility_preferences_ciphertext`
  - `student_exam_accommodations.accessibility_preferences_iv`
  - `student_exam_accommodations.accessibility_preferences_tag`

### Legacy Compatibility

Older records may still contain a combined legacy AES envelope in:

- `users.department_enc`
- `users.phone_enc`
- `users.bio_enc`
- `submissions.feedback_enc`
- `submissions.answers_json[*].answer`

The backend keeps these records readable during migration, then repairs them into the new three-part storage format.

### Where Encryption Occurs

- `POST /api/auth/register`
  - Encrypts `department`
- `PUT /api/users/profile`
  - Encrypts `department`, `phone`, `bio`
- `POST /api/users`
  - Encrypts `department`, `phone`, `bio`
- `PUT /api/users/{id}`
  - Encrypts `department`, `phone`, `bio`
- `POST /api/results/submit`
  - Encrypts each exam answer into `answerCiphertext`, `answerIv`, `answerTag`
- `PUT /api/exams/{id}/accommodations/{studentId}`
  - Encrypts `accessibilityPreferences`
- `PUT /api/results/{id}/grade`
  - Encrypts `feedback`
  - Re-encrypts each answer into the same three-part format

### Where Decryption Occurs

Decryption is centralized in `App\Services\Support\ExamMapper` before JSON is returned to API clients.

- Auth and profile reads decrypt user department, phone, and bio
- Accommodation reads decrypt `accessibilityPreferences`
- Student exam reads decrypt and expose accommodation summaries
- Result reads decrypt exam answers and feedback
- Legacy fallback reads decrypt the old combined `gcmv1:<iv>:<tag>:<ciphertext>` format when needed

### Key Management

- Encryption key source: `APP_ENCRYPTION_KEY` in `backend/.env` or the environment
- Supported key formats:
  - raw 32-byte string
  - plain base64 that resolves to 32 bytes
  - `base64:<...>` that resolves to 32 bytes
  - 64-character hex string
- Invalid keys fail fast during bootstrap
- The key is loaded via configuration and is not hardcoded in controllers or services

## Deployment Notes

- Recommended hosted split:
  - Vercel frontend
  - Render backend plus Render cron job
  - Aiven MySQL
- Render health check path: `/api/health`
- Hosted bootstrap command:

```bash
cd backend
composer bootstrap-database
```

- For Aiven deployments, set `DB_SSL_MODE=verify-ca`, point `DB_SSL_CA` to the Aiven CA certificate file, and set `LOG_DB_NAME` equal to `DB_NAME` for the simplest single-database setup
- In hosted environments, set `CORS_ALLOW_ALL=false` and configure `CORS_ALLOWED_ORIGINS` to the deployed frontend origin

## Migration and Legacy Record Repair

### Database Files

- App base schema: `backend/database/app_001_schema_routines.sql`
- App AES split-storage add-on schema: `backend/database/app_002_schema_split_encrypted_storage.sql`
- App question analytics migration: `backend/database/app_003_migrate_add_question_analytics.sql`
- App student accommodations migration: `backend/database/app_004_migrate_add_student_exam_accommodations.sql`
- App submission attempts migration: `backend/database/app_005_migrate_enable_submission_attempts.sql`
- Logs schema: `backend/database/logs_001_logging_routines.sql`
- Logs exam violations migration: `backend/database/logs_002_migrate_add_exam_violations.sql`
- Logs violation cases migration: `backend/database/logs_003_migrate_add_violation_cases.sql`
- Logs violation case procedure fix: `backend/database/logs_004_migrate_fix_violation_case_procedures.sql`
- Logs admin read-model routines: `backend/database/logs_005_admin_log_read_models.sql`

### Repair Step

Run after importing the add-on schema:

```bash
cd backend
composer repair-encrypted-storage
```

This repair flow:

- finds legacy combined-envelope user records
- finds legacy combined-envelope feedback and answer records
- splits them into ciphertext, IV, and tag
- writes them back into the new columns / JSON keys
- clears the legacy combined fields after successful conversion

## Student Accommodations and Attempt Flow

### Accommodation Fields

Teacher/admin accommodation upserts may set:

- `extraTimeMinutes`
- `alternateStartAt`
- `alternateEndAt`
- `attemptLimit`
- `accessibilityPreferences`

Validation rules:

- `extraTimeMinutes >= 0`
- `attemptLimit >= 1` when provided
- alternate schedule fields must be provided together
- effective end must be later than effective start
- `accessibilityPreferences` must be JSON-encodable

### Effective Student Exam Fields

Student exam reads include:

- `attemptLimit`
- `attemptsUsed`
- `extraTimeMinutes`
- `effectiveStartDate`
- `effectiveEndDate`
- `accessibilityPreferences`

### Submission Attempt Fields

Submission/result reads include:

- `attemptNo`
- `startedAt`
- `allowedDurationMinutes`
- `effectiveWindowStartAt`
- `effectiveWindowEndAt`

### Attempt Enforcement

- `POST /api/results/start` creates an `in_progress` attempt.
- `POST /api/results/submit` accepts:
  - `submissionId` for explicit started-attempt submission
  - legacy `examId` for compatibility, which auto-starts a fresh attempt first
- Start rules:
  - student must see the exam
  - exam must be `published`
  - current time must be inside the effective allowed schedule
  - attempt limit must not already be exhausted
  - another active in-progress attempt blocks a new start
- Submit rules:
  - answers payload must be valid
  - submission must belong to the student
  - submission must still be `in_progress`
  - submit after the effective window or time limit marks the attempt `expired` and returns `409`

## Main Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a student or teacher |
| POST | `/api/auth/login` | Authenticate and receive token |
| DELETE | `/api/auth/logout` | Revoke current session token |
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update current user profile |
| GET | `/api/users` | Admin user list |
| POST | `/api/users` | Admin creates user |
| PUT | `/api/users/{id}` | Admin updates user |
| DELETE | `/api/users/{id}` | Admin deletes user |
| GET | `/api/exams` | List exams |
| POST | `/api/exams` | Create exam |
| GET | `/api/exams/{id}` | Get exam by id |
| PUT | `/api/exams/{id}` | Update exam |
| DELETE | `/api/exams/{id}` | Delete exam |
| GET | `/api/exams/{id}/accommodations` | List per-student accommodations for an exam |
| GET | `/api/exams/{id}/accommodations/{studentId}` | Get one student accommodation override |
| PUT | `/api/exams/{id}/accommodations/{studentId}` | Create or update one student accommodation override |
| DELETE | `/api/exams/{id}/accommodations/{studentId}` | Remove one student accommodation override |
| POST | `/api/results/start` | Start a trusted in-progress exam attempt |
| POST | `/api/results/submit` | Submit exam answers |
| GET | `/api/results/student/{id}` | Get results by student |
| PUT | `/api/results/{id}/grade` | Grade a submission |
| GET | `/api/admin/exams` | Admin exams overview |
| GET | `/api/admin/results` | Admin results overview |
| GET | `/api/admin/logs` | Admin request and audit logs |
| GET | `/api/admin/violations` | Admin anti-cheat violation dashboard |
| GET | `/api/reports/exam-performance` | Exam performance report |
| GET | `/api/reports/pass-fail` | Pass/fail report |
| GET | `/api/data/all` | Role-filtered aggregate data |
| POST | `/api/data/reseed` | Admin reseed action |
| GET | `/api/docs/verify` | Admin route-verification utility |

## Notes

- Passwords are never encrypted. They are hashed with `password_hash()`.
- API responses always return decrypted plaintext for authorized consumers, never raw encrypted database payloads.
- Student accommodations are stored as additive migrations, not by editing the base schema file.
- The frontend remains unchanged; only the backend storage and compatibility logic were updated for compliance.
