# Netlify + Render + Railway Deployment Guide

This repo is prepared for the following hosted split:

- Frontend: Netlify
- Backend: Render
- Database: Railway MySQL

## 1. Railway MySQL

Provision a Railway MySQL database first.

Use the Railway-provided connection details as the source of truth for:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

Recommended logging setup on Railway:

- set `LOG_DB_NAME` equal to `DB_NAME`

That keeps request/audit logging in the same Railway database and avoids needing a second hosted database during setup.

## 2. Render Backend

Create a Render web service from this repository using [render.yaml](/C:/xampp/htdocs/group8/render.yaml).

Important Render environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `LOG_DB_NAME`
- `APP_JWT_SECRET`
- `APP_ENCRYPTION_KEY`
- `CORS_ALLOW_ALL=false`
- `CORS_ALLOWED_ORIGINS=<your Netlify site URL>`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_TEACHER_EMAIL`
- `SEED_TEACHER_PASSWORD`
- `SEED_STUDENT_EMAIL`
- `SEED_STUDENT_PASSWORD`

Health check:

- `/api/health`

### Bootstrap the Database

After the Render service can reach Railway and the environment variables are configured, run:

```bash
cd backend
composer bootstrap-database
```

What it does:

- applies `schema_routines.sql`
- applies `schema_split_encrypted_storage.sql`
- applies `logging_routines.sql`
- retargets local hardcoded schema database names to the deployed database names
- repairs legacy encrypted records into the split AES storage format

## 3. Netlify Frontend

This repo includes [netlify.toml](/C:/xampp/htdocs/group8/netlify.toml) with:

- `frontend/` as the build base
- `npm run build`
- `dist` publish directory
- SPA route rewrite to `/index.html`

Set this Netlify environment variable:

```env
VITE_PHP_BASE_URL=https://your-render-service.onrender.com/api
```

## 4. Verification

After deployment:

1. Visit the Render health endpoint:
   - `https://<your-render-service>.onrender.com/api/health`
2. Log in with your seed admin account.
3. Confirm Netlify can load data from the Render API.
4. Confirm encrypted fields are returned as decrypted plaintext in API responses, not as ciphertext/IV/tag payloads.

## 5. Security Notes

- Use Render-managed secrets for `APP_JWT_SECRET` and `APP_ENCRYPTION_KEY`
- `APP_ENCRYPTION_KEY` may be raw 32-byte, plain base64, `base64:<...>`, or 64-character hex
- Do not enable `CORS_ALLOW_ALL` in hosted environments
- Passwords remain hashed with `password_hash()`, never encrypted
