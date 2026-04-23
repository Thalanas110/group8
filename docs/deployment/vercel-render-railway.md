# Vercel + Render + Railway Deployment Guide

This repo is prepared for the following hosted split:

- Frontend: Vercel
- Backend API: Render web service
- Scheduled backend work: Render cron job
- Database: Railway MySQL

## 1. Railway MySQL

Provision a Railway MySQL database first.

Because Render runs outside your Railway project, use Railway's external TCP proxy connection details as the source of truth for:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

Recommended logging setup on Railway:

- set `LOG_DB_NAME` equal to `DB_NAME`

That keeps request/audit logging in the same Railway database and avoids needing a second hosted database during setup.

No Railway cron service is required for this repo's current app maintenance work. Log retention is handled by the Render cron job below. For database backups, prefer Railway's native backup feature; only add a Railway cron service if you later introduce a short-lived backup/export container that exits after each run.

Manual Railway SQL import order for the app database:

1. `backend/database/app_001_schema_routines.sql`
2. `backend/database/app_002_schema_split_encrypted_storage.sql`
3. `backend/database/app_003_migrate_add_question_analytics.sql`
4. `backend/database/app_004_migrate_add_student_exam_accommodations.sql`
5. `backend/database/app_005_migrate_enable_submission_attempts.sql`

Manual Railway SQL import order for the logs database:

1. `backend/database/logs_001_logging_routines.sql`
2. `backend/database/logs_002_migrate_add_exam_violations.sql`
3. `backend/database/logs_003_migrate_add_violation_cases.sql`
4. `backend/database/logs_004_migrate_fix_violation_case_procedures.sql`

## 2. Render Backend

Create a Render web service from this repository using [render.yaml](/C:/xampp/htdocs/group8/render.yaml).

The Blueprint creates:

- `examhub-api`: Docker web service, health check `/api/health`
- `examhub-log-retention`: Docker cron job, scheduled daily at `00:00 UTC`
- `examhub-railway-mysql`: Render environment group for Railway MySQL connection values
- `examhub-render-runtime`: Render environment group for shared backend runtime values

Important: Render does not create or own the MySQL database. Fill the `examhub-railway-mysql` environment group with Railway's external TCP proxy values:

- `DB_HOST=<Railway MYSQLHOST or TCP proxy host>`
- `DB_PORT=<Railway MYSQLPORT or TCP proxy port>`
- `DB_NAME=<Railway MYSQLDATABASE>`
- `DB_USER=<Railway MYSQLUSER>`
- `DB_PASS=<Railway MYSQLPASSWORD>`
- `LOG_DB_NAME=<same value as DB_NAME unless you provision a separate logs database>`

The `examhub-render-runtime` group contains Render-side app settings:

- `APP_JWT_SECRET`
- `APP_ENCRYPTION_KEY`
- `AUTH_TOKEN_TTL_SECONDS=28800`
- `LOG_RETENTION_DAYS=90`
- `CORS_ALLOW_ALL=false`
- `CORS_ALLOWED_ORIGINS=<your Vercel site URL>`

Set these seed values only on the `examhub-api` web service:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_TEACHER_EMAIL`
- `SEED_TEACHER_PASSWORD`
- `SEED_STUDENT_EMAIL`
- `SEED_STUDENT_PASSWORD`

The cron job uses the same Railway MySQL environment group and runs:

```bash
php /var/www/html/backend/scripts/purge_log_retention.php
```

### Bootstrap the Database

After the Render service can reach Railway and the environment variables are configured, run the bootstrap against Railway MySQL:

```bash
cd backend
composer bootstrap-database
```

What it does:

- applies every ordered `backend/database/app_*.sql` file to the app database
- applies every ordered `backend/database/logs_*.sql` file to the logs database
- retargets local hardcoded schema database names to the deployed database names
- repairs legacy encrypted records into the split AES storage format

That means new database work, including the student accommodation and attempt-flow rollout, deploys through new migration files instead of changing the original schema files.

## 3. Vercel Frontend

Import the same Git repository in Vercel and set the project root directory to:

```text
frontend
```

The frontend project includes [frontend/vercel.json](/C:/xampp/htdocs/group8/frontend/vercel.json) with:

- framework preset: Vite
- install command: `npm ci`
- build command: `npm run build`
- output directory: `dist/client`
- SPA route rewrite to `/_shell.html`

Set this Vercel environment variable:

```env
VITE_PHP_BASE_URL=https://your-render-service.onrender.com/api
```

## 4. Verification

After deployment:

1. Visit the Render health endpoint:
   - `https://<your-render-service>.onrender.com/api/health`
2. Log in with your seed admin account.
3. Confirm Vercel can load data from the Render API.
4. Confirm encrypted fields are returned as decrypted plaintext in API responses, not as ciphertext/IV/tag payloads.
5. Confirm teacher/admin accommodation endpoints work and student `POST /api/results/start` respects attempt limits and alternate schedules.
6. Trigger the Render cron job manually once and confirm the job exits successfully.

## 5. Security Notes

- Use Render-managed secrets for `APP_JWT_SECRET` and `APP_ENCRYPTION_KEY`
- `APP_ENCRYPTION_KEY` may be raw 32-byte, plain base64, `base64:<...>`, or 64-character hex
- Do not enable `CORS_ALLOW_ALL` in hosted environments
- Set `CORS_ALLOWED_ORIGINS` to your Vercel production domain and any custom domain you attach
- Passwords remain hashed with `password_hash()`, never encrypted
