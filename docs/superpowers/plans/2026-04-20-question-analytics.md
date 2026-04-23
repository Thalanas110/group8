# Per-Question Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backward-compatible per-question analytics with question topics, attempt telemetry, and teacher/admin analytics views.

**Architecture:** Extend the exam question schema with optional topic metadata, persist per-question telemetry for new submissions in a dedicated relational table, and aggregate scoped analytics in PHP for a reusable frontend analytics surface. Existing exams and submissions continue to work, with analytics coverage shown explicitly when telemetry or topic data is missing.

**Tech Stack:** React, TypeScript, Vite, PHP 8, MySQL stored procedures, Recharts, existing ExamHub UI components.

---

### Task 1: Data Model and Validation

**Files:**
- Modify: `backend/database/app_001_schema_routines.sql`
- Modify: `backend/src/Services/Support/ExamPayloadValidator.php`
- Modify: `backend/src/Services/Support/ValueNormalizer.php`
- Modify: `backend/src/Services/Support/ExamMapper.php`
- Modify: `frontend/src/app/data/types.ts`
- Test: `backend/tests/ExamValidationTest.php`

- [ ] Add optional `topic` support to question validation, normalization, mapping, and shared frontend types.
- [ ] Add `submission_question_metrics` table and stored procedures for telemetry storage and retrieval.
- [ ] Extend validation coverage with a test that proves topics are accepted without breaking existing payload rules.

### Task 2: Submission Telemetry Capture and Persistence

**Files:**
- Modify: `frontend/src/app/pages/student/TakeExam.tsx`
- Modify: `frontend/src/app/context/AppContext.tsx`
- Modify: `frontend/src/app/services/api.ts`
- Modify: `backend/src/Services/ResultService.php`

- [ ] Capture per-question time spent, visit count, and answer change count during new exam attempts.
- [ ] Send telemetry alongside the submission payload without breaking old payload shapes.
- [ ] Persist telemetry rows after submission in the backend using the new stored procedures.

### Task 3: Analytics Aggregation API

**Files:**
- Create: `backend/src/Services/Support/QuestionAnalyticsBuilder.php`
- Modify: `backend/src/Services/ReportService.php`
- Modify: `backend/src/Controllers/ReportsController.php`
- Modify: `backend/src/Routing/Routes/ReportRoutes.php`
- Modify: `backend/src/Bootstrap/ServiceContainer.php`
- Test: `backend/tests/QuestionAnalyticsBuilderTest.php`

- [ ] Build a pure PHP analytics aggregator that computes hardest questions, slowest questions, common wrong answers, weak topics by class, and coverage stats.
- [ ] Expose the analytics through a new teacher/admin report endpoint.
- [ ] Cover the aggregator with focused tests for backward-compatible and telemetry-enabled scenarios.

### Task 4: Teacher and Admin Analytics UI

**Files:**
- Create: `frontend/src/app/components/analytics/QuestionAnalyticsSection.tsx`
- Create: `frontend/src/app/pages/teacher/TeacherAnalytics.tsx`
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/app/pages/teacher/TeacherLayout.tsx`
- Modify: `frontend/src/app/pages/admin/AdminReports.tsx`
- Modify: `frontend/src/app/services/api.ts`

- [ ] Add a reusable analytics section that fetches and renders question intelligence with coverage messaging.
- [ ] Add a teacher-facing analytics route and navigation item.
- [ ] Fold the same section into the admin reports page without disrupting the existing reports layout.

### Task 5: Teacher Exam Authoring UX

**Files:**
- Modify: `frontend/src/app/pages/teacher/TeacherExams.tsx`

- [ ] Add an optional topic field to each question editor row.
- [ ] Preserve existing exam editing behavior for questions that have no topic.
- [ ] Surface short helper copy that explains topics power weak-topic analytics.

### Task 6: Docs, API Catalog, and Verification

**Files:**
- Modify: `frontend/src/app/services/api.ts`
- Modify: `frontend/src/app/pages/admin/AdminApiReference.tsx`
- Test: `backend/tests/SecuritySmokeTest.php` (run unchanged as regression coverage)

- [ ] Add API typings and docs catalog entries for question analytics and submission telemetry.
- [ ] Run backend regression tests and a frontend production build as completion gates.
