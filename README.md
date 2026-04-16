# ExamHub (Containerized)

## Run with Docker

```bash
docker compose up --build -d
```

Frontend:
- http://localhost:8080

Backend API (direct):
- http://localhost:8081/api/health

## Seed Credentials

- Admin: `admin@examhub.local` / `Admin123!`
- Teacher: `teacher@examhub.local` / `Teacher123!`
- Student: `student@examhub.local` / `Student123!`

## Useful Commands

```bash
# watch logs
docker compose logs -f

# stop containers
docker compose down

# stop + remove DB volume (full reset)
docker compose down -v
```

## Notes

- MySQL initializes automatically from:
  - `backend/database/schema_routines.sql`
  - `backend/database/logging_routines.sql`
- The frontend is served by Nginx and proxies `/api` to the PHP backend container.
