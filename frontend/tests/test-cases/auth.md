# Auth Cases

## FE-AUTH-001

- Feature: Authentication
- Persona: Teacher
- Purpose: Verify that sign-in still routes a successful teacher login into the teacher workspace after frontend refactors.
- Preconditions: The login page is reachable and the frontend can receive a valid auth response.
- Test Data: `teacher@example.com` with a mocked successful login payload and a populated `/api/data/all` response.
- Steps:
  1. Open `/login`.
  2. Fill the institution email field.
  3. Fill the password field.
  4. Click `Sign In`.
- Expected Results:
  1. The login request succeeds.
  2. The data bootstrap request succeeds.
  3. The app redirects to `/teacher`.
  4. The teacher workspace chrome is visible.
- Failure Signals:
  1. The login form stays on screen after submit.
  2. The redirect lands on the wrong role workspace.
  3. Teacher layout chrome or teacher identity is missing.
- Playwright Mapping: `tests/e2e/auth/auth.spec.ts > FE-AUTH-001 user can sign in and land on the teacher workspace`

## FE-AUTH-002

- Feature: Authentication
- Persona: Student
- Purpose: Verify that registration still creates a student session and routes the user into the student workspace.
- Preconditions: The registration page is reachable and the frontend can receive a valid register response.
- Test Data: `student@example.com` with a mocked successful register payload and a populated `/api/data/all` response.
- Steps:
  1. Open `/register`.
  2. Fill the profile, role, and password fields.
  3. Click `Create Account`.
- Expected Results:
  1. The register request succeeds.
  2. The app stores the session.
  3. The redirect lands on `/student`.
  4. The student workspace chrome is visible.
- Failure Signals:
  1. Validation blocks a valid payload.
  2. The session is not established.
  3. The app lands on the wrong workspace.
- Playwright Mapping: `tests/e2e/auth/auth.spec.ts > FE-AUTH-002 user can register as a student and land on the student workspace`
