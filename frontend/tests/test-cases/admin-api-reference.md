# Admin API Reference Cases

## FE-API-001

- Feature: Admin API Reference
- Persona: Admin
- Purpose: Preserve the docs verification interaction while moving API reference helpers into feature-local modules.
- Preconditions: An admin session exists and the backend verification endpoint returns a successful verification payload.
- Test Data: One mocked verification response showing `13` required endpoints and `13` matched endpoints.
- Steps:
  1. Open `/admin/api`.
  2. Click `Verify Endpoints`.
- Expected Results:
  1. The API reference header remains visible.
  2. The verification request succeeds.
  3. The verification summary updates.
  4. A last-run timestamp appears.
- Failure Signals:
  1. The verify action does not issue a request.
  2. The verification panel does not update.
  3. The page breaks after verification.
- Playwright Mapping: `tests/e2e/admin/admin-api-reference.spec.ts > FE-API-001 admin can verify documented endpoints from the API reference page`
