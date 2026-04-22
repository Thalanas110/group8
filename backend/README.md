# ExamHub PHP Backend

This backend is a vanilla PHP 8+ JSON API that matches the frontend contract and keeps AES-256-GCM encryption isolated in dedicated backend utilities.

## Compliance Summary

- Runtime: vanilla PHP 8+ with custom routing/controllers
- API style: REST-style JSON responses with proper HTTP status codes
- Database: MySQL/MariaDB using group-designed schema + stored routines
- Authentication: custom JWT plus persisted token sessions
- Validation: request parsing and service-layer validation with structured API errors
- Password handling: `password_hash()` only, never encrypted

## AES-256-GCM Security

### Encrypted Fields

- `users.department_ciphertext`, `users.department_iv`, `users.department_tag`
- `users.phone_ciphertext`, `users.phone_iv`, `users.phone_tag`
- `users.bio_ciphertext`, `users.bio_iv`, `users.bio_tag`
- `submissions.answers_json[*].answerCiphertext`, `answerIv`, `answerTag`
- `submissions.feedback_ciphertext`, `submissions.feedback_iv`, `submissions.feedback_tag`

Legacy compatibility is still supported for:

- `users.department_enc`
- `users.phone_enc`
- `users.bio_enc`
- `submissions.feedback_enc`
- `submissions.answers_json[*].answer`

### Encryption Points

- `POST /auth/register` encrypts `department`
- `PUT /users/profile` encrypts `department`, `phone`, `bio`
- `POST /users` encrypts `department`, `phone`, `bio`
- `PUT /users/:id` encrypts `department`, `phone`, `bio`
- `POST /results/submit` encrypts each submitted answer
- `PUT /results/:id/grade` encrypts `feedback` and stores answer payloads in the split AES format

### Decryption Points

Decryption is centralized in `App\Services\Support\ExamMapper` before JSON is returned.

- auth/profile/user reads decrypt department, phone, and bio
- result reads decrypt answers and feedback
- legacy combined envelopes are still readable until repaired

### Key Management

- Key source: `APP_ENCRYPTION_KEY` from `backend/.env` or the runtime environment
- Accepted formats:
  - raw 32-byte string
  - plain base64 that decodes to 32 bytes
  - `base64:<...>` that decodes to 32 bytes
  - 64-character hex string
- Invalid keys fail fast during bootstrap
- The key is loaded from configuration, not hardcoded in controllers or services

## Database Files

- Base schema and routines: `backend/database/schema_routines.sql`
- AES split-storage add-on: `backend/database/schema_split_encrypted_storage.sql`
- Logging schema and routines: `backend/database/logging_routines.sql`

## Setup

### Local / XAMPP

1. Create `backend/.env` from `backend/.env.example`.
2. Run `composer install` inside `backend/`.
3. Import:
   - `schema_routines.sql`
   - `schema_split_encrypted_storage.sql`
   - `logging_routines.sql`
4. Run `composer repair-encrypted-storage`.
5. Ensure Apache rewrite is enabled and `/api/*` resolves to `api/index.php`.

### Hosted Bootstrap

After setting deployed environment variables, run:

```bash
cd backend
composer bootstrap-database
```

The bootstrap script:

- connects to your configured deployment databases
- applies the repo SQL in the correct order
- retargets the hardcoded local database names to the deployed database names
- repairs legacy encrypted records after the split-storage schema is applied

## Netlify + Render + Railway

Recommended deployment split:

- Netlify serves the frontend SPA
- Render runs the PHP backend from [render.yaml](/C:/xampp/htdocs/group8/render.yaml)
- Railway provides MySQL

### Render Backend Notes

- Runtime: Docker, using `docker/backend/Dockerfile`
- Health check path: `/api/health`
- Set `CORS_ALLOW_ALL=false`
- Set `CORS_ALLOWED_ORIGINS` to your Netlify site URL
- Set the required seed credential env vars on first deploy if the database is empty

### Railway Database Notes

For Railway, the simplest setup is:

- `DB_NAME=<your Railway MYSQLDATABASE value>`
- `LOG_DB_NAME=<same value as DB_NAME>`

That keeps both application tables and fail-open logging tables in the same Railway database, which avoids needing a second hosted database name during first deployment.

### Netlify Frontend Notes

Set `VITE_PHP_BASE_URL` in Netlify to your Render backend URL, for example:

```env
VITE_PHP_BASE_URL=https://your-render-service.onrender.com/api
```

The repo includes [netlify.toml](/C:/xampp/htdocs/group8/netlify.toml) for:

- monorepo base directory selection (`frontend/`)
- Vite build command
- SPA route rewrites to `index.html`

## CORS

Environment variables:

- `CORS_ALLOW_ALL=true` for local development
- `CORS_ALLOW_ALL=false` in hosted environments
- `CORS_ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.example.com`

When `CORS_ALLOW_ALL=false`, requests from unlisted origins are rejected.

## Seed Accounts

Seed credentials are loaded only from environment variables:

- `SEED_ADMIN_*`
- `SEED_TEACHER_*`
- `SEED_STUDENT_*`

If the database is empty and these credentials are missing, bootstrap requests will fail until they are configured.

## Main Endpoints

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`
- Users: `/users/profile`, `/users`, `/users/:id`
- Exams: `/exams`, `/exams/:id`
- Results: `/results/submit`, `/results/student/:id`, `/results/:id/grade`
- Admin: `/admin/exams`, `/admin/results`
- Reports: `/reports/exam-performance`, `/reports/pass-fail`, `/reports/question-analytics`
- Classes: `/classes`, `/classes/join`, `/classes/:id/leave`, `/classes/:id/enroll`, `/classes/:id/students/:studentId`
- Data: `/data/all`, `/data/reseed`
- Docs: `/docs/verify`
- Health: `/health`

## Frontend Connection

Local example:

```env
VITE_PHP_BASE_URL=http://localhost/group8/api
```

Hosted example:

```env
VITE_PHP_BASE_URL=https://your-render-service.onrender.com/api
```
