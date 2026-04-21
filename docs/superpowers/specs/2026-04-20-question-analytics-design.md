# Per-Question Analytics Design

**Date:** 2026-04-20
**Status:** Approved in-thread

## Goal

Add per-question analytics for teachers and admins, including question difficulty, common wrong answers, time spent, and weak topics by class.

## Constraints

- Backward compatibility is required.
- Historical exams and submissions must remain valid.
- Time-spent analytics only apply to new attempts that capture telemetry.
- Weak-topic analytics only apply to questions that include explicit per-question `topic` metadata.

## Product Decisions

1. Teachers tag each question with a `topic`.
2. Student exam attempts record per-question telemetry for new submissions only.
3. Older submissions remain readable and participate only in analytics that can be derived safely from existing data.
4. Missing telemetry or topic data is represented as partial coverage, not fabricated values.

## Data Model

### Question metadata

Each question gains an optional `topic` field. Existing questions without `topic` remain valid.

### Submission telemetry

New exam attempts capture per-question telemetry:

- `questionId`
- `topic`
- `timeSpentSeconds`
- `visitCount`
- `answerChangeCount`

Telemetry is stored separately from `submissions.answers_json` so grading payloads remain stable and old submissions do not need migration.

## Analytics Outputs

### Question difficulty

- Based on awarded marks divided by maximum marks.
- MCQ questions use existing correct-answer logic.
- Non-MCQ questions only contribute after grading supplies `marksAwarded`.

### Common wrong answers

- Available for MCQ questions.
- Shows the most-selected incorrect options and their counts/shares.

### Time spent

- Based only on telemetry-enabled submissions.
- Older submissions show no time data.

### Weak topics by class

- Grouped by `classId` + `topic`.
- Only includes questions with explicit topic tags.
- Older questions without topics are excluded rather than guessed.

## Backend Approach

- Extend exam validation, normalization, and mapping to support `topic`.
- Add a new `submission_question_metrics` table plus stored procedures for insert/query.
- Persist telemetry during result submission.
- Add a dedicated report endpoint for question analytics.
- Aggregate analytics in PHP service code from scoped exams, submissions, and telemetry rows.

## Frontend Approach

- Add `topic` input to teacher exam question editor.
- Capture per-question timing and interaction counts during exam-taking.
- Send telemetry with submission payload.
- Add a teacher analytics page and enhance admin reports with a reusable question analytics section.
- Clearly label coverage for telemetry-based metrics.

## Backward Compatibility

- Existing exams without `topic` remain editable and submittable.
- Existing submissions remain readable and gradeable.
- Difficulty and wrong-answer analytics still work where answers and marks exist.
- Time-spent and weak-topic analytics degrade gracefully when data is absent.
