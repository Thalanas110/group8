# ExamHub

ExamHub is a containerized online examination system with:

- frontend in `frontend/`
- vanilla PHP backend API in `api/` + `backend/`
- MySQL/MariaDB schema and routines in `backend/database/`

## Local Docker

Run the full stack locally with Docker:

```bash
docker compose up --build -d
```

Local URLs:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:8081/api/health`

The local MySQL container now initializes from:

- `backend/database/schema_routines.sql`
- `backend/database/schema_split_encrypted_storage.sql`
- `backend/database/migrate_add_question_analytics.sql`
- `backend/database/migrate_add_student_exam_accommodations.sql`
- `backend/database/migrate_enable_submission_attempts.sql`
- `backend/database/logging_routines.sql`
- `backend/database/migrate_add_exam_violations.sql`

Useful commands:

```bash
# watch logs
docker compose logs -f

# stop containers
docker compose down

# stop + remove DB volume (full reset)
docker compose down -v
```

## Hosted Deployment

The recommended hosted split for this repo is:

- Frontend: Netlify
- Backend API: Render
- Database: Railway MySQL

Deployment assets included in the repo:

- [render.yaml](/C:/xampp/htdocs/group8/render.yaml)
- [netlify.toml](/C:/xampp/htdocs/group8/netlify.toml)
- [backend/scripts/bootstrap_database.php](/C:/xampp/htdocs/group8/backend/scripts/bootstrap_database.php)

Use the backend bootstrap command after configuring hosted environment variables:

```bash
cd backend
composer bootstrap-database
```

That command applies the repo SQL in the correct order, retargets the hardcoded local database names to your deployed database names, and repairs legacy encrypted records.
It now also auto-discovers and applies every `backend/database/migrate_*.sql` file, so new DB work can ship as additive migrations without editing the base schema.

## Docs

- Backend/security guide: [backend/README.md](/C:/xampp/htdocs/group8/backend/README.md)
- API documentation: [docs/api/backend-api-documentation.md](/C:/xampp/htdocs/group8/docs/api/backend-api-documentation.md)
- Deployment guide: [docs/deployment/netlify-render-railway.md](/C:/xampp/htdocs/group8/docs/deployment/netlify-render-railway.md)
