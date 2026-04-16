# Exam System PHP Backend

This backend matches the API contract in `frontend/src/app/services/api.ts` and enforces:

- AES-256-GCM encryption for sensitive fields (`department`, `phone`, `bio`, `feedback`)
- strict role-based access control (student/teacher/admin)
- OOP PHP architecture
- **stored-routine-only** data access (no inline SQL in PHP)
- `utf8mb4` database encoding
- dedicated logging database (`request_logs` + `audit_logs`) with fail-open writes

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

## Frontend Connection

The frontend defaults to `http://localhost/examsysnewest/api` in PHP mode.
If needed:

- set backend mode to `php` in the API docs panel
- set `VITE_PHP_BASE_URL` in frontend `.env` when using a different host/path
