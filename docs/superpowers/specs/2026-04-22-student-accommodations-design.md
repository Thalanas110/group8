# Student Exam Accommodations Design

**Date:** 2026-04-22

## Goal

Add per-student, per-exam accommodations to the backend so the API can store and enforce:

- extra time
- alternate schedules
- attempt limits
- accessibility preferences

The backend must also support multiple real attempts per student per exam, with a server-side attempt start flow that records trusted attempt timing.

## Scope

- Backend only
- Vanilla PHP services/controllers/routes
- MySQL/MariaDB schema changes delivered only through new SQL files
- Stored-routine-based data access preserved
- Existing encryption model reused where it fits the new data
- Documentation updated for the new endpoints and behavior

## Approved Approach

Use a per-`student + exam` accommodations table plus a submission-attempt upgrade:

- Add a new `student_exam_accommodations` table keyed by `(exam_id, student_id)`.
- Keep `submissions` as the central attempt/result record, but evolve it from one-row-per-student-per-exam into one-row-per-attempt.
- Add a server-side `start attempt` endpoint so the backend records trusted `startedAt`.
- Keep `POST /results/submit` but allow it to submit either an explicitly started attempt or a legacy one-shot submit path for compatibility.

## Data Model

### New table: `student_exam_accommodations`

One row represents an override for a particular student on a particular exam.

Fields:

- `id`
- `exam_id`
- `student_id`
- `extra_time_minutes`
- `alternate_start_at`
- `alternate_end_at`
- `attempt_limit`
- `accessibility_preferences_ciphertext`
- `accessibility_preferences_iv`
- `accessibility_preferences_tag`
- timestamps

Constraints:

- unique key on `(exam_id, student_id)`
- foreign keys to `exams(id)` and `users(id)`

Accessibility preferences will be stored encrypted because they can reveal sensitive student needs.

### Evolve table: `submissions`

Keep `submissions` as the canonical attempt/result table, but make it attempt-aware.

Add:

- `attempt_no`
- `started_at`
- `allowed_duration_minutes`
- `effective_window_start_at`
- `effective_window_end_at`

Change:

- drop the existing unique key on `(exam_id, student_id)`
- add a unique key on `(exam_id, student_id, attempt_no)`
- allow `submitted_at` to be nullable for `in_progress` attempts
- expand `status` to support `in_progress`, `submitted`, `graded`, and `expired`

## Runtime Design

### Accommodation Management

Add exam-scoped admin/teacher endpoints:

- `GET /exams/:id/accommodations`
- `GET /exams/:id/accommodations/:studentId`
- `PUT /exams/:id/accommodations/:studentId`
- `DELETE /exams/:id/accommodations/:studentId`

Rules:

- only admin/teacher may manage accommodations
- teachers may only manage accommodations for their own exams
- the target user must be a student
- the target student must belong to the exam’s class

### Effective Attempt Policy

For a given student and exam, the effective policy is:

- `attemptLimit` = accommodation override, else `1`
- `extraTimeMinutes` = accommodation override, else `0`
- `effectiveStartDate` = alternate start override, else exam start
- `effectiveEndDate` = alternate end override, else exam end
- `allowedDurationMinutes` = exam duration + extra time
- `accessibilityPreferences` = decrypted preferences array/object, informational only

### Attempt Lifecycle

Add `POST /results/start` for students.

Start flow:

1. Validate that the exam is visible to the student.
2. Validate that the exam is `published`.
3. Resolve the effective policy from the exam plus any accommodation row.
4. Reject start if the current time is outside the effective window.
5. Reject start if the attempt limit is already exhausted.
6. If an existing `in_progress` attempt is still active, reject the new start.
7. If an `in_progress` attempt has already timed out, mark it `expired`.
8. Insert a new attempt row with `status = in_progress`.

Submit flow:

- Prefer explicit submit by `submissionId`
- Preserve compatibility by allowing submit with `examId` only, which auto-starts a fresh attempt and immediately submits it
- Validate:
  - the attempt belongs to the student
  - the attempt is still `in_progress`
  - the current time is still within the effective schedule
  - the current time is not beyond `startedAt + allowedDurationMinutes`
- If timing is violated at submit time, mark the attempt `expired` and return `409`

### Result and Exam Reads

Student-facing exam responses should include:

- `attemptLimit`
- `attemptsUsed`
- `extraTimeMinutes`
- `effectiveStartDate`
- `effectiveEndDate`
- `accessibilityPreferences`

Submission responses should include:

- `attemptNo`
- `startedAt`
- `allowedDurationMinutes`
- `effectiveWindowStartAt`
- `effectiveWindowEndAt`

## Validation Rules

Accommodation upsert:

- `extraTimeMinutes >= 0`
- `attemptLimit >= 1` when provided
- alternate datetimes must parse correctly
- resolved end must be later than resolved start
- accessibility preferences must JSON-encode successfully

Attempt start:

- student-only
- published exam only
- must be inside the resolved window
- attempts used must be below the resolved limit

Attempt submit:

- strict answers validation stays in place
- must target an owned `in_progress` attempt
- must still be within schedule and time limit

## Backward Compatibility

To avoid immediately breaking the existing frontend:

- add `POST /results/start`
- keep `POST /results/submit`
- allow `POST /results/submit` without `submissionId` to auto-start and submit a new attempt

This preserves current clients while enabling a stronger timed-attempt flow for new clients.

## Testing Strategy

- Add service-level coverage for accommodation CRUD and validation.
- Add attempt-flow tests for:
  - start attempt success
  - attempt limit exhaustion
  - alternate schedule enforcement
  - extra time enforcement
  - attempt numbering
- Keep existing result validation and encryption tests passing.
- Add compatibility coverage for the legacy submit shape.

## Documentation Deliverables

- Update backend README with new accommodation endpoints and attempt flow
- Update deployment/bootstrap docs so new migration files are applied
- Update API docs to document:
  - new endpoints
  - new result/exam response fields
  - enforcement behavior
  - encrypted accessibility preferences storage
