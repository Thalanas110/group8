# Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the frontend into a modular, senior-level architecture while preserving the exact current UI, current context-based state flow, existing routes, and frontend behavior.

**Architecture:** Keep `AppProvider` and `useApp()` as the public state contract, but move implementation details into focused domain/context modules, feature-local modules, and split backend services. Establish Playwright as the only frontend test runner, add documented browser scenarios first, then refactor behind those characterization guards.

**Tech Stack:** React 18, Vite 6, TypeScript, React Router 7, Tailwind CSS 4, Sonner, Playwright, existing PHP backend API

---

### Task 1: Add Playwright Infrastructure And Test Documentation

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/e2e/.gitkeep`
- Create: `frontend/tests/fixtures/.gitkeep`
- Create: `frontend/tests/test-cases/auth.md`
- Create: `frontend/tests/test-cases/student-take-exam.md`
- Create: `frontend/tests/test-cases/teacher-exams.md`
- Create: `frontend/tests/test-cases/teacher-violation-cases.md`
- Create: `frontend/tests/test-cases/admin-api-reference.md`
- Modify: `frontend/README.md`

- [ ] **Step 1: Write the failing frontend tooling expectation into the repo plan**

Create the Playwright config file with the expected structure and local dev server boot command:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 2: Add the failing package scripts and dependency entries**

Update `frontend/package.json` so the frontend has deterministic Playwright commands:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "1.54.2"
  }
}
```

- [ ] **Step 3: Add documented test-case files before the first browser spec**

Write markdown case files with this exact case shape:

```md
# Student Take Exam Cases

## FE-TAKE-001

- Feature: Student Take Exam
- Persona: Student
- Purpose: Verify the exam auto-submits after the third focus violation
- Preconditions: Student account can access a published exam
- Test Data: Published exam with at least one question
- Steps:
  1. Open the student exam page.
  2. Start the exam.
  3. Trigger three focus violations.
- Expected Results:
  1. A warning appears after the first and second violations.
  2. The third violation auto-submits the exam.
  3. The submitted screen is shown.
- Failure Signals:
  1. No warning appears.
  2. Violation count is incorrect.
  3. The exam does not auto-submit.
- Playwright Mapping: `tests/e2e/student/take-exam.spec.ts > FE-TAKE-001 student auto-submits after the third focus violation`
```

- [ ] **Step 4: Install and verify Playwright**

Run:

```bash
cd frontend
npm install
npx playwright install chromium
```

Expected: install succeeds and Chromium is available to Playwright without changing the app behavior.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.ts frontend/tests/e2e/.gitkeep frontend/tests/fixtures/.gitkeep frontend/tests/test-cases/auth.md frontend/tests/test-cases/student-take-exam.md frontend/tests/test-cases/teacher-exams.md frontend/tests/test-cases/teacher-violation-cases.md frontend/tests/test-cases/admin-api-reference.md frontend/README.md
git commit -m "test: add playwright frontend infrastructure"
```

### Task 2: Add Playwright Characterization Coverage Before Structural Refactors

**Files:**
- Create: `frontend/tests/e2e/auth/auth.spec.ts`
- Create: `frontend/tests/e2e/student/take-exam.spec.ts`
- Create: `frontend/tests/e2e/teacher/teacher-exams.spec.ts`
- Create: `frontend/tests/e2e/teacher/teacher-violation-cases.spec.ts`
- Create: `frontend/tests/e2e/admin/admin-api-reference.spec.ts`
- Modify: `frontend/tests/test-cases/auth.md`
- Modify: `frontend/tests/test-cases/student-take-exam.md`
- Modify: `frontend/tests/test-cases/teacher-exams.md`
- Modify: `frontend/tests/test-cases/teacher-violation-cases.md`
- Modify: `frontend/tests/test-cases/admin-api-reference.md`
- Test: `frontend/tests/e2e/**/*.spec.ts`

- [ ] **Step 1: Write the failing auth characterization test**

Create:

```ts
import { test, expect } from '@playwright/test';

test('FE-AUTH-001 user can open login and submit valid credentials', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  await page.getByLabel(/email/i).fill('teacher@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/teacher|student|admin/);
});
```

- [ ] **Step 2: Write the failing student and teacher characterization tests**

Create high-risk browser specs first:

```ts
test('FE-TAKE-001 student auto-submits after the third focus violation', async ({ page }) => {
  await page.goto('/student/take-exam/test-exam');
  await page.getByRole('button', { name: /start exam/i }).click();
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
});

test('FE-EXAMS-003 teacher cannot save an exam whose question marks exceed total marks', async ({ page }) => {
  await page.goto('/teacher/exams');
  await page.getByRole('button', { name: /create exam/i }).click();
  await page.getByLabel(/exam title/i).fill('Playwright Exam');
  await page.getByRole('button', { name: /create exam/i }).click();
  await expect(page.getByText(/question points exceed total marks/i)).toBeVisible();
});
```

- [ ] **Step 3: Write the failing admin and violation-review characterization tests**

Create:

```ts
test('FE-VCASE-001 teacher can open a violation case review modal', async ({ page }) => {
  await page.goto('/teacher/violation-cases');
  await page.getByRole('button', { name: /review/i }).first().click();
  await expect(page.getByRole('heading', { name: /review case/i })).toBeVisible();
});

test('FE-API-001 admin can verify documented endpoints from the API reference page', async ({ page }) => {
  await page.goto('/admin/api');
  await page.getByRole('button', { name: /verify endpoints/i }).click();
  await expect(page.getByText(/required/i)).toBeVisible();
});
```

- [ ] **Step 4: Run Playwright to capture the initial baseline**

Run:

```bash
cd frontend
npm run test:e2e
```

Expected: some specs may fail initially due to environment data assumptions, but the suite structure exists and each case maps directly to a documented scenario file.

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/e2e/auth/auth.spec.ts frontend/tests/e2e/student/take-exam.spec.ts frontend/tests/e2e/teacher/teacher-exams.spec.ts frontend/tests/e2e/teacher/teacher-violation-cases.spec.ts frontend/tests/e2e/admin/admin-api-reference.spec.ts frontend/tests/test-cases/auth.md frontend/tests/test-cases/student-take-exam.md frontend/tests/test-cases/teacher-exams.md frontend/tests/test-cases/teacher-violation-cases.md frontend/tests/test-cases/admin-api-reference.md
git commit -m "test: add playwright characterization coverage"
```

### Task 3: Split Shared HTTP And Service Domains Behind A Stable API Facade

**Files:**
- Modify: `frontend/src/app/services/api.ts`
- Create: `frontend/src/app/services/http/base-url.ts`
- Create: `frontend/src/app/services/http/request.ts`
- Create: `frontend/src/app/services/auth.service.ts`
- Create: `frontend/src/app/services/user.service.ts`
- Create: `frontend/src/app/services/exam.service.ts`
- Create: `frontend/src/app/services/result.service.ts`
- Create: `frontend/src/app/services/class.service.ts`
- Create: `frontend/src/app/services/report.service.ts`
- Create: `frontend/src/app/services/accommodation.service.ts`
- Create: `frontend/src/app/services/violation.service.ts`
- Create: `frontend/src/app/services/docs.service.ts`
- Test: `frontend/tests/e2e/admin/admin-api-reference.spec.ts`

- [ ] **Step 1: Extract the base URL and request helper without changing the public imports**

Create:

```ts
// frontend/src/app/services/http/base-url.ts
const envPhpBaseUrl = (import.meta.env.VITE_PHP_BASE_URL as string | undefined)?.trim();

export const PHP_BASE_URL = envPhpBaseUrl && envPhpBaseUrl !== ''
  ? envPhpBaseUrl
  : 'http://localhost/group8/api';
```

```ts
// frontend/src/app/services/http/request.ts
import { PHP_BASE_URL } from './base-url';

export async function request<T>(method: string, path: string, body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('examhub_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${PHP_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorPayload.error ?? errorPayload.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 2: Move each API domain into a focused service file**

Example:

```ts
// frontend/src/app/services/auth.service.ts
import { request } from './http/request';

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: (payload: LoginPayload) => request('POST', '/auth/login', payload),
  logout: () => request('DELETE', '/auth/logout', undefined, true),
};
```

- [ ] **Step 3: Turn `services/api.ts` into a compatibility facade**

Replace the file body with re-exports such as:

```ts
export { PHP_BASE_URL } from './http/base-url';
export { request } from './http/request';
export * from './auth.service';
export * from './user.service';
export * from './exam.service';
export * from './result.service';
export * from './class.service';
export * from './report.service';
export * from './accommodation.service';
export * from './violation.service';
export * from './docs.service';
```

- [ ] **Step 4: Run the admin API reference Playwright spec to confirm service compatibility**

Run:

```bash
cd frontend
npm run test:e2e -- tests/e2e/admin/admin-api-reference.spec.ts
```

Expected: the admin API reference page still renders and verifies through the same `services/api.ts` import surface.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/services/api.ts frontend/src/app/services/http/base-url.ts frontend/src/app/services/http/request.ts frontend/src/app/services/auth.service.ts frontend/src/app/services/user.service.ts frontend/src/app/services/exam.service.ts frontend/src/app/services/result.service.ts frontend/src/app/services/class.service.ts frontend/src/app/services/report.service.ts frontend/src/app/services/accommodation.service.ts frontend/src/app/services/violation.service.ts frontend/src/app/services/docs.service.ts
git commit -m "refactor: split frontend services by domain"
```

### Task 4: Refactor App Context Into Domain Modules While Keeping `useApp()` Stable

**Files:**
- Modify: `frontend/src/app/context/AppContext.tsx`
- Create: `frontend/src/app/context/app-context.types.ts`
- Create: `frontend/src/app/context/app-context.storage.ts`
- Create: `frontend/src/app/context/app-context.selectors.ts`
- Create: `frontend/src/app/context/domains/auth-domain.ts`
- Create: `frontend/src/app/context/domains/user-domain.ts`
- Create: `frontend/src/app/context/domains/class-domain.ts`
- Create: `frontend/src/app/context/domains/exam-domain.ts`
- Create: `frontend/src/app/context/domains/submission-domain.ts`
- Test: `frontend/tests/e2e/auth/auth.spec.ts`
- Test: `frontend/tests/e2e/student/take-exam.spec.ts`
- Test: `frontend/tests/e2e/teacher/teacher-exams.spec.ts`

- [ ] **Step 1: Extract the public context contract into a shared types file**

Create:

```ts
import type { User, Class, Exam, Submission } from '../data/types';

export interface AppContextType {
  currentUser: User | null;
  apiLoading: boolean;
  users: User[];
  classes: Class[];
  exams: Exam[];
  submissions: Submission[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}
```

- [ ] **Step 2: Extract storage helpers and selectors before moving domain actions**

Create:

```ts
export const APP_STORAGE_KEYS = {
  token: 'examhub_token',
  user: 'examhub_user',
} as const;
```

```ts
import type { Submission } from '../data/types';

export function getSubmissionsByExam(submissions: Submission[], examId: string) {
  return submissions.filter(submission => submission.examId === examId);
}
```

- [ ] **Step 3: Move auth, users, classes, exams, and submissions into domain modules**

Example domain signature:

```ts
export function createAuthDomain(deps: {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setApiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}) {
  return {
    async login(email: string, password: string) {
      // move exact existing login behavior here
    },
  };
}
```

- [ ] **Step 4: Reassemble the provider so consumers still use `useApp()` unchanged**

Keep:

```ts
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
```

Expected: no page import needs to change from `useApp()` during this task.

- [ ] **Step 5: Run the guarded Playwright suite and commit**

Run:

```bash
cd frontend
npm run test:e2e -- tests/e2e/auth/auth.spec.ts tests/e2e/student/take-exam.spec.ts tests/e2e/teacher/teacher-exams.spec.ts
```

Then:

```bash
git add frontend/src/app/context/AppContext.tsx frontend/src/app/context/app-context.types.ts frontend/src/app/context/app-context.storage.ts frontend/src/app/context/app-context.selectors.ts frontend/src/app/context/domains/auth-domain.ts frontend/src/app/context/domains/user-domain.ts frontend/src/app/context/domains/class-domain.ts frontend/src/app/context/domains/exam-domain.ts frontend/src/app/context/domains/submission-domain.ts
git commit -m "refactor: modularize app context domains"
```

### Task 5: Split Student Take Exam Into A Feature Module Without Changing UI

**Files:**
- Modify: `frontend/src/app/pages/student/TakeExam.tsx`
- Modify: `frontend/src/app/pages/student/ExamFocusViolationState.ts`
- Delete: `frontend/src/app/pages/student/ExamFocusViolationState.test.ts`
- Create: `frontend/src/app/features/student/take-exam/constants.ts`
- Create: `frontend/src/app/features/student/take-exam/lib/telemetry.ts`
- Create: `frontend/src/app/features/student/take-exam/lib/time.ts`
- Create: `frontend/src/app/features/student/take-exam/lib/submission.ts`
- Create: `frontend/src/app/features/student/take-exam/hooks/useExamAttempt.ts`
- Create: `frontend/src/app/features/student/take-exam/components/TakeExamStartScreen.tsx`
- Create: `frontend/src/app/features/student/take-exam/components/TakeExamSubmittedScreen.tsx`
- Create: `frontend/src/app/features/student/take-exam/components/TakeExamWorkspace.tsx`
- Test: `frontend/tests/e2e/student/take-exam.spec.ts`

- [ ] **Step 1: Remove the frontend unit-style test that no longer matches the project standard**

Delete:

```text
frontend/src/app/pages/student/ExamFocusViolationState.test.ts
```

The browser behavior it covered must remain protected by Playwright scenarios.

- [ ] **Step 2: Extract stable constants and pure helpers**

Create:

```ts
// constants.ts
export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];
export const MAX_TAB_SWITCHES = 3;
export const VIOLATION_COOLDOWN_MS = 3000;
```

```ts
// lib/time.ts
export function formatExamTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 3: Extract the orchestration hook and presentation sections**

The route file should end up as a thin container like:

```ts
export function TakeExam() {
  const examAttempt = useExamAttempt();

  if (examAttempt.state === 'submitted') {
    return <TakeExamSubmittedScreen {...examAttempt.submittedView} />;
  }

  if (examAttempt.state === 'ready') {
    return <TakeExamStartScreen {...examAttempt.startView} />;
  }

  return <TakeExamWorkspace {...examAttempt.workspaceView} />;
}
```

- [ ] **Step 4: Preserve the exact rendered markup while moving code**

When extracting JSX sections, copy the existing markup and class strings exactly into the feature components. Only move code; do not redesign or rename UI.

- [ ] **Step 5: Run Playwright and commit**

Run:

```bash
cd frontend
npm run test:e2e -- tests/e2e/student/take-exam.spec.ts
```

Then:

```bash
git add frontend/src/app/pages/student/TakeExam.tsx frontend/src/app/pages/student/ExamFocusViolationState.ts frontend/src/app/features/student/take-exam/constants.ts frontend/src/app/features/student/take-exam/lib/telemetry.ts frontend/src/app/features/student/take-exam/lib/time.ts frontend/src/app/features/student/take-exam/lib/submission.ts frontend/src/app/features/student/take-exam/hooks/useExamAttempt.ts frontend/src/app/features/student/take-exam/components/TakeExamStartScreen.tsx frontend/src/app/features/student/take-exam/components/TakeExamSubmittedScreen.tsx frontend/src/app/features/student/take-exam/components/TakeExamWorkspace.tsx
git rm frontend/src/app/pages/student/ExamFocusViolationState.test.ts
git commit -m "refactor: modularize student take exam flow"
```

### Task 6: Split Teacher Exams Into A Feature Module Without Changing UI

**Files:**
- Modify: `frontend/src/app/pages/teacher/TeacherExams.tsx`
- Create: `frontend/src/app/features/teacher/exams/constants.ts`
- Create: `frontend/src/app/features/teacher/exams/lib/validation.ts`
- Create: `frontend/src/app/features/teacher/exams/lib/form.ts`
- Create: `frontend/src/app/features/teacher/exams/hooks/useTeacherExamEditor.ts`
- Create: `frontend/src/app/features/teacher/exams/components/TeacherExamsHeader.tsx`
- Create: `frontend/src/app/features/teacher/exams/components/TeacherExamList.tsx`
- Create: `frontend/src/app/features/teacher/exams/components/TeacherExamEditorModal.tsx`
- Create: `frontend/src/app/features/teacher/exams/components/TeacherViolationsModal.tsx`
- Test: `frontend/tests/e2e/teacher/teacher-exams.spec.ts`

- [ ] **Step 1: Extract validation and status-transition helpers**

Create:

```ts
import type { Exam, Question, ExamStatus } from '../../../data/types';

export type ExamFormData = Omit<Exam, 'id' | 'createdAt' | 'teacherId'>;

export function validateExamForm(form: ExamFormData): string | null {
  // move the exact current implementation from TeacherExams.tsx
  return null;
}

export function getNextExamStatus(status: ExamStatus): ExamStatus {
  if (status === 'draft') return 'published';
  if (status === 'published') return 'completed';
  return 'draft';
}
```

- [ ] **Step 2: Extract modal orchestration into a feature hook**

Create a hook that owns:

- `showModal`
- `editingExam`
- `deleteTarget`
- `expandedExam`
- `filter`
- `accommodationsExam`
- `violationsExam`
- `violations`
- `violationsLoading`
- `form`

- [ ] **Step 3: Extract exact existing JSX into feature-local components**

Split:

- header and filter bar
- exam list/details section
- create/edit modal body
- anti-cheat violations modal

Keep the existing classes and text exactly as they are now.

- [ ] **Step 4: Make the route file a thin feature container**

Target shape:

```ts
export function TeacherExams() {
  const model = useTeacherExamEditor();
  return (
    <>
      <TeacherExamsHeader {...model.header} />
      <TeacherExamList {...model.list} />
      <TeacherExamEditorModal {...model.editorModal} />
      <TeacherViolationsModal {...model.violationsModal} />
    </>
  );
}
```

- [ ] **Step 5: Run Playwright and commit**

Run:

```bash
cd frontend
npm run test:e2e -- tests/e2e/teacher/teacher-exams.spec.ts
```

Then:

```bash
git add frontend/src/app/pages/teacher/TeacherExams.tsx frontend/src/app/features/teacher/exams/constants.ts frontend/src/app/features/teacher/exams/lib/validation.ts frontend/src/app/features/teacher/exams/lib/form.ts frontend/src/app/features/teacher/exams/hooks/useTeacherExamEditor.ts frontend/src/app/features/teacher/exams/components/TeacherExamsHeader.tsx frontend/src/app/features/teacher/exams/components/TeacherExamList.tsx frontend/src/app/features/teacher/exams/components/TeacherExamEditorModal.tsx frontend/src/app/features/teacher/exams/components/TeacherViolationsModal.tsx
git commit -m "refactor: modularize teacher exams feature"
```

### Task 7: Split Teacher Violation Cases, Admin API Reference, And Analytics

**Files:**
- Modify: `frontend/src/app/pages/teacher/TeacherViolationCases.tsx`
- Modify: `frontend/src/app/pages/admin/AdminApiReference.tsx`
- Modify: `frontend/src/app/components/analytics/QuestionAnalyticsSection.tsx`
- Create: `frontend/src/app/features/teacher/violation-cases/constants.ts`
- Create: `frontend/src/app/features/teacher/violation-cases/lib/case-meta.tsx`
- Create: `frontend/src/app/features/teacher/violation-cases/hooks/useViolationCases.ts`
- Create: `frontend/src/app/features/teacher/violation-cases/components/ReviewModal.tsx`
- Create: `frontend/src/app/features/teacher/violation-cases/components/ViolationCasesTable.tsx`
- Create: `frontend/src/app/features/admin/api-reference/lib/api-reference.ts`
- Create: `frontend/src/app/features/admin/api-reference/components/VerificationPanel.tsx`
- Create: `frontend/src/app/features/admin/api-reference/components/EndpointCard.tsx`
- Create: `frontend/src/app/features/admin/api-reference/components/PhpBackendPanel.tsx`
- Create: `frontend/src/app/features/analytics/question-analytics/lib/formatters.ts`
- Create: `frontend/src/app/features/analytics/question-analytics/lib/filters.ts`
- Create: `frontend/src/app/features/analytics/question-analytics/components/ListCard.tsx`
- Create: `frontend/src/app/features/analytics/question-analytics/components/EmptyState.tsx`
- Test: `frontend/tests/e2e/teacher/teacher-violation-cases.spec.ts`
- Test: `frontend/tests/e2e/admin/admin-api-reference.spec.ts`

- [ ] **Step 1: Extract teacher violation-case metadata and hook logic**

Move:

- `MAX_TAB_SWITCHES`
- `suggestSeverity`
- `SEVERITY_META`
- `OUTCOME_META`
- `violationTypeLabel`
- data-loading/orchestration state

into feature files under `features/teacher/violation-cases`.

- [ ] **Step 2: Extract admin API reference helpers and sections**

Move:

- `METHOD_STYLES`
- `GROUP_ORDER`
- `normalizePath`
- `endpointKey`
- `MethodBadge`
- `CopyButton`
- `VerificationBadge`
- `PhpBackendPanel`
- `VerificationPanel`
- `EndpointCard`
- `GroupSection`

into `features/admin/api-reference`.

- [ ] **Step 3: Extract analytics filters, formatters, and list components**

Move:

- `formatSeconds`
- `scoreTone`
- filtered collection logic
- `ListCard`
- `EmptyState`

into `features/analytics/question-analytics`.

- [ ] **Step 4: Keep the route/component exports stable while moving internals**

The exported component names and import paths used elsewhere should remain stable in this task, even if the implementation body becomes a thin wrapper.

- [ ] **Step 5: Run Playwright and commit**

Run:

```bash
cd frontend
npm run test:e2e -- tests/e2e/teacher/teacher-violation-cases.spec.ts tests/e2e/admin/admin-api-reference.spec.ts
```

Then:

```bash
git add frontend/src/app/pages/teacher/TeacherViolationCases.tsx frontend/src/app/pages/admin/AdminApiReference.tsx frontend/src/app/components/analytics/QuestionAnalyticsSection.tsx frontend/src/app/features/teacher/violation-cases/constants.ts frontend/src/app/features/teacher/violation-cases/lib/case-meta.tsx frontend/src/app/features/teacher/violation-cases/hooks/useViolationCases.ts frontend/src/app/features/teacher/violation-cases/components/ReviewModal.tsx frontend/src/app/features/teacher/violation-cases/components/ViolationCasesTable.tsx frontend/src/app/features/admin/api-reference/lib/api-reference.ts frontend/src/app/features/admin/api-reference/components/VerificationPanel.tsx frontend/src/app/features/admin/api-reference/components/EndpointCard.tsx frontend/src/app/features/admin/api-reference/components/PhpBackendPanel.tsx frontend/src/app/features/analytics/question-analytics/lib/formatters.ts frontend/src/app/features/analytics/question-analytics/lib/filters.ts frontend/src/app/features/analytics/question-analytics/components/ListCard.tsx frontend/src/app/features/analytics/question-analytics/components/EmptyState.tsx
git commit -m "refactor: split teacher admin and analytics features"
```

### Task 8: Shared Cleanup, Route Cleanup, And Final Verification

**Files:**
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/app/App.tsx`
- Modify: any route files reduced to thin containers during Tasks 5-7
- Modify: `frontend/README.md`
- Test: `frontend/tests/e2e/**/*.spec.ts`

- [ ] **Step 1: Remove any leftover feature-specific code from shared locations**

Audit and move remaining single-feature helpers out of:

- `frontend/src/app/components/shared`
- `frontend/src/app/pages/*`

while keeping only truly shared UI there.

- [ ] **Step 2: Normalize route-entry imports to point at thin page containers**

Keep `routes.tsx` stable, but ensure page files only compose feature roots rather than owning large inline logic.

- [ ] **Step 3: Update frontend README with the final testing and refactor conventions**

Document:

- Playwright install
- Playwright run commands
- documented case-file location
- rule that frontend tests live in Playwright only

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
cd frontend
npm run build
npm run test:e2e
```

Expected:

- production build succeeds
- Playwright suite passes
- no route behavior changes are observed

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/routes.tsx frontend/src/app/App.tsx frontend/README.md frontend/tests/e2e frontend/tests/test-cases
git commit -m "refactor: finalize modular frontend architecture"
```
