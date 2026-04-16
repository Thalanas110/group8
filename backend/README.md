# Exam System PHP Backend

This backend matches the API contract in `frontend/src/app/services/api.ts` and enforces:

- AES-256-GCM encryption for sensitive fields (`department`, `phone`, `bio`, exam answers, `feedback`)
- strict role-based access control (student/teacher/admin)
- OOP PHP architecture
- stored-routine-only data access (no inline SQL in PHP)
- `utf8mb4` database encoding
- dedicated logging database (`request_logs` + `audit_logs`) with fail-open writes

## Project Compliance Summary

- Runtime: vanilla PHP 8+ (no Laravel/Slim frameworks)
- API style: REST-style JSON responses with HTTP status codes
- Database: MySQL/MariaDB
- Authentication: custom JWT implementation + persisted token sessions
- Validation: service-layer payload validation with structured API errors
- Error handling: `ApiException` mapped to correct HTTP status codes

## AES-256-GCM Security Documentation

### Encrypted Sensitive Fields

- `users.department_enc` (`department`)
- `users.phone_enc` (`phone`)
- `users.bio_enc` (`bio`)
- `submissions.answers_json[*].answer` (exam answers, encrypted per answer value)
- `submissions.feedback_enc` (`feedback`)

Passwords are never encrypted and are always hashed with `password_hash()`.

### Encryption Points (Create/Update)

- `POST /auth/register` -> encrypts `department`
- `PUT /users/profile` -> encrypts `department`, `phone`, `bio`
- `POST /users` -> encrypts `department`, `phone`, `bio`
- `PUT /users/:id` -> encrypts `department`, `phone`, `bio`
- `POST /results/submit` -> encrypts each `answers[].answer`
- `PUT /results/:id/grade` -> encrypts `feedback` and re-encrypts each `answers[].answer`

### Decryption Points (Read)

Decryption is centralized in `App\Services\Support\ExamMapper` before returning API responses:

- auth/profile/user reads -> decrypt `department`, `phone`, `bio`
- result reads -> decrypt `answers[].answer` and `feedback`

### Key Management

- Key source: `APP_ENCRYPTION_KEY` from `backend/.env` (or environment variable)
- Accepted formats:
  - raw 32-byte value
  - `base64:<...>` that decodes to 32 bytes
  - 64-character hex string
- Invalid key format/length fails fast during bootstrap.
- Key is injected via config and not hardcoded inside controllers/services.

### AES-256-GCM Envelope Storage

Each encrypted value stores all required GCM components in one envelope:

- `iv` (12-byte random nonce)
- `tag` (16-byte authentication tag)
- ciphertext

Format: `gcmv1:<iv_b64>:<tag_b64>:<cipher_b64>`.

## Seed Accounts

Seed account values are loaded from environment variables only (`SEED_ADMIN_*`, `SEED_TEACHER_*`, `SEED_STUDENT_*`).
No seed credentials are hardcoded in PHP or SQL files.

## Setup

1. Create `.env` from `.env.example`:
   - `backend/.env`
2. Install PHP dependencies with Composer:
   - from `backend/`, run `composer install`
3. Import SQL schema and routines:
   - `backend/database/schema_routines.sql`
   - `backend/database/logging_routines.sql`
4. Configure logging DB in `.env` if different from primary DB:
   - `LOG_DB_HOST`, `LOG_DB_PORT`, `LOG_DB_NAME`, `LOG_DB_USER`, `LOG_DB_PASS`
   - `LOG_RETENTION_DAYS` (default: `90`)
5. Ensure Apache rewrite is enabled (`mod_rewrite`).
6. Serve this repo so `/api/*` resolves to `api/index.php`.

## Endpoints

All frontend endpoints are implemented:

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`
- Users: `/users/profile`, `/users`, `/users/:id`
- Exams: `/exams`, `/exams/:id`
- Results: `/results/submit`, `/results/student/:id`, `/results/:id/grade`
- Admin: `/admin/exams`, `/admin/results`
- Reports: `/reports/exam-performance`, `/reports/pass-fail`
- Classes: `/classes`, `/classes/join`, `/classes/:id/leave`, `/classes/:id/enroll`, `/classes/:id/students/:studentId`
- Data: `/data/all`, `/data/reseed`
- Docs: `/docs/verify` (admin, validates required endpoint coverage from backend route code)

## Frontend Connection

The frontend defaults to `http://localhost/examsysnewest/api` in PHP mode.
If needed:

- set backend mode to `php` in the API docs panel
- set `VITE_PHP_BASE_URL` in frontend `.env` when using a different host/path
