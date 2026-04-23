# Student Exam Accommodations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-student, per-exam accommodations with enforced extra time, alternate schedule windows, attempt limits, and server-tracked multi-attempt exam submissions.

**Architecture:** Introduce a new accommodations table plus new stored procedures, evolve `submissions` into per-attempt records, add an accommodations service/controller and a `POST /results/start` flow, then enrich student exam/submission responses with effective policy metadata while preserving legacy one-shot submit compatibility.

**Tech Stack:** Vanilla PHP 8+, MySQL/MariaDB stored procedures, OpenSSL AES-256-GCM, JSON APIs, standalone PHP regression tests.

---

### Task 1: Lock In Database And Service Regression Tests

**Files:**
- Create: `backend/tests/StudentExamAccommodationServiceTest.php`
- Create: `backend/tests/ResultAttemptFlowTest.php`
- Modify: `backend/composer.json`
- Test: `backend/tests/StudentExamAccommodationServiceTest.php`
- Test: `backend/tests/ResultAttemptFlowTest.php`

- [ ] **Step 1: Write the failing test**

Add a service test that expects:

```php
$result = $service->upsertAccommodation($teacherAuth, $examId, $studentId, [
    'extraTimeMinutes' => 30,
    'alternateStartAt' => '2026-04-22T09:00:00Z',
    'alternateEndAt' => '2026-04-22T12:00:00Z',
    'attemptLimit' => 3,
    'accessibilityPreferences' => ['screenReader' => true],
]);

assert($result['extraTimeMinutes'] === 30);
assert($result['attemptLimit'] === 3);
assert($result['accessibilityPreferences']['screenReader'] === true);
```

Add an attempt flow test that expects:

```php
$attempt1 = $resultService->startAttempt($studentAuth, ['examId' => $examId]);
assert($attempt1['attemptNo'] === 1);
assert($attempt1['status'] === 'in_progress');

$submitted = $resultService->submitResult($studentAuth, [
    'submissionId' => $attempt1['id'],
    'answers' => [['questionId' => 'q-demo-1', 'answer' => '4']],
    'submittedAt' => '2026-04-22T09:05:00Z',
]);
assert($submitted['attemptNo'] === 1);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`

Expected: FAIL because the service, routes, and database support do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Only add enough test scaffolding and assertions to define the target behavior and failure mode clearly.

- [ ] **Step 4: Run tests to verify they still fail for the right reason**

Run:

- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`

Expected: FAIL with missing stored procedures, missing methods, or missing fields rather than syntax errors.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/StudentExamAccommodationServiceTest.php backend/tests/ResultAttemptFlowTest.php backend/composer.json
git commit -m "test: add student accommodation and attempt flow coverage"
```

### Task 2: Add New SQL Migration Files For Accommodations And Attempts

**Files:**
- Create: `backend/database/app_004_migrate_add_student_exam_accommodations.sql`
- Create: `backend/database/app_005_migrate_enable_submission_attempts.sql`
- Modify: `backend/scripts/bootstrap_database.php`
- Modify: `docker-compose.yml`
- Test: `backend/tests/StudentExamAccommodationServiceTest.php`
- Test: `backend/tests/ResultAttemptFlowTest.php`

- [ ] **Step 1: Write the failing test**

Extend the new tests so they require:

- accommodation CRUD stored procedures
- multi-attempt submission rows
- attempt-aware result retrieval fields

- [ ] **Step 2: Run tests to verify they fail**

Run:

- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`

Expected: FAIL because the database schema and procedures are missing.

- [ ] **Step 3: Write minimal implementation**

Add the two new SQL files with:

- `student_exam_accommodations`
- encrypted accessibility preference columns
- submission attempt columns and keys
- attempt-aware results procedures
- accommodation CRUD procedures

Update local/bootstrap execution order so the new files are applied after the base schema.

- [ ] **Step 4: Run tests to verify the database layer is now reachable**

Run:

- `cmd.exe /c composer bootstrap-database`
- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`

Expected: schema/bootstrap succeeds, tests still fail at missing PHP behavior rather than missing SQL objects.

- [ ] **Step 5: Commit**

```bash
git add backend/database/app_004_migrate_add_student_exam_accommodations.sql backend/database/app_005_migrate_enable_submission_attempts.sql backend/scripts/bootstrap_database.php docker-compose.yml
git commit -m "feat: add accommodation and attempt schema migrations"
```

### Task 3: Implement Accommodation CRUD In Backend Services And Routes

**Files:**
- Create: `backend/src/Services/StudentExamAccommodationService.php`
- Create: `backend/src/Controllers/ExamAccommodationsController.php`
- Create: `backend/src/Routing/Routes/ExamAccommodationRoutes.php`
- Modify: `backend/src/Services/Support/ExamMapper.php`
- Modify: `backend/src/Bootstrap/ServiceContainer.php`
- Modify: `backend/src/Routing/Routes/ApiRouteRegistry.php`
- Test: `backend/tests/StudentExamAccommodationServiceTest.php`

- [ ] **Step 1: Write the failing test**

Expand the service test to cover:

- teacher may upsert accommodation for owned exam
- teacher/admin may list accommodations
- invalid `attemptLimit` returns `422`
- invalid alternate window returns `422`
- delete removes the override

- [ ] **Step 2: Run test to verify it fails**

Run: `php backend/tests/StudentExamAccommodationServiceTest.php`
Expected: FAIL until the service/controller/route layer exists.

- [ ] **Step 3: Write minimal implementation**

Implement:

- accommodation row mapping with decrypted accessibility preferences
- teacher/admin ownership checks
- student-role and class-membership validation
- encrypted accessibility preference writes

- [ ] **Step 4: Run test to verify it passes**

Run: `php backend/tests/StudentExamAccommodationServiceTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/Services/StudentExamAccommodationService.php backend/src/Controllers/ExamAccommodationsController.php backend/src/Routing/Routes/ExamAccommodationRoutes.php backend/src/Services/Support/ExamMapper.php backend/src/Bootstrap/ServiceContainer.php backend/src/Routing/Routes/ApiRouteRegistry.php backend/tests/StudentExamAccommodationServiceTest.php
git commit -m "feat: add exam accommodation management endpoints"
```

### Task 4: Implement Attempt Start, Submit Enforcement, And Attempt Metadata

**Files:**
- Modify: `backend/src/Services/ResultService.php`
- Modify: `backend/src/Controllers/ResultsController.php`
- Modify: `backend/src/Routing/Routes/ResultRoutes.php`
- Modify: `backend/src/Services/ExamService.php`
- Modify: `backend/src/Services/Support/ExamMapper.php`
- Test: `backend/tests/ResultAttemptFlowTest.php`
- Test: `backend/tests/ResultSubmissionValidationTest.php`

- [ ] **Step 1: Write the failing test**

Expand the attempt flow test to cover:

- `POST /results/start` equivalent service behavior
- attempt numbering increments from `1` to `2`
- attempt limit exhaustion returns `409`
- submit outside effective window marks attempt expired and returns `409`
- extra time extends the allowed duration
- legacy submit without `submissionId` still works by auto-starting a new attempt

- [ ] **Step 2: Run tests to verify they fail**

Run:

- `php backend/tests/ResultAttemptFlowTest.php`
- `php backend/tests/ResultSubmissionValidationTest.php`

Expected: FAIL until attempt start and enforcement logic exist.

- [ ] **Step 3: Write minimal implementation**

Add:

- `startAttempt()`
- attempt expiry checks
- compatibility submit path
- attempt metadata in submission responses
- student exam enrichment with effective policy summary

- [ ] **Step 4: Run tests to verify they pass**

Run:

- `php backend/tests/ResultAttemptFlowTest.php`
- `php backend/tests/ResultSubmissionValidationTest.php`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/Services/ResultService.php backend/src/Controllers/ResultsController.php backend/src/Routing/Routes/ResultRoutes.php backend/src/Services/ExamService.php backend/src/Services/Support/ExamMapper.php backend/tests/ResultAttemptFlowTest.php backend/tests/ResultSubmissionValidationTest.php
git commit -m "feat: enforce accommodated exam attempts"
```

### Task 5: Update Docs And Run Full Verification

**Files:**
- Modify: `backend/README.md`
- Modify: `docs/api/backend-api-documentation.md`
- Modify: `README.md`
- Modify: `docs/deployment/netlify-render-railway.md`
- Test: `backend/tests/StudentExamAccommodationServiceTest.php`
- Test: `backend/tests/ResultAttemptFlowTest.php`
- Test: `backend/tests/SecuritySmokeTest.php`
- Test: `backend/tests/EncryptionStorageCompatibilityTest.php`
- Test: `backend/tests/UserServiceValidationTest.php`
- Test: `backend/tests/RequestInvalidJsonTest.php`

- [ ] **Step 1: Write the failing test**

Document the new endpoint names and payload fields in the docs, then verify the route list and smoke tests still reflect the new backend behavior.

- [ ] **Step 2: Run tests to verify docs/runtime expectations fail if mismatched**

Run:

- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`

Expected: PASS for feature behavior before final doc edits; use this as the safety gate before docs changes.

- [ ] **Step 3: Write minimal implementation**

Update docs to cover:

- accommodation endpoints
- `POST /results/start`
- multi-attempt result behavior
- enforced alternate schedules and extra time
- encrypted accessibility preferences
- new migration import order

- [ ] **Step 4: Run full verification**

Run:

- `cmd.exe /c composer bootstrap-database`
- `php backend/tests/StudentExamAccommodationServiceTest.php`
- `php backend/tests/ResultAttemptFlowTest.php`
- `php backend/tests/SecuritySmokeTest.php`
- `php backend/tests/EncryptionStorageCompatibilityTest.php`
- `php backend/tests/UserServiceValidationTest.php`
- `Get-Content backend/tests/fixtures/invalid-request-body.json -Raw | php backend/tests/RequestInvalidJsonTest.php`

Expected: PASS for all commands.

- [ ] **Step 5: Commit**

```bash
git add backend/README.md docs/api/backend-api-documentation.md README.md docs/deployment/netlify-render-railway.md
git commit -m "docs: add student accommodations backend documentation"
```
