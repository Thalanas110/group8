# Frontend Refactor Design

**Date:** 2026-04-22

## Goal

Refactor the React frontend into a consistent, senior-level architecture without changing:

- visible UI
- route structure
- backend contract usage
- public context-based state model
- user-facing functionality

The end state must keep the current experience exactly as it is while removing page and service monoliths, extracting domain logic into focused modules, and standardizing frontend test coverage on Playwright with highly documented test cases.

## Scope

- Frontend only
- Existing React + Vite application
- Preserve the current context-based data flow
- Preserve the current route tree and screen behavior
- Preserve the current rendered UI structure, copy, classes, icons, and interaction flow
- Restructure code into stable feature, service, context, constant, and utility boundaries
- Add or standardize Playwright-based frontend testing where the refactor introduces risk
- Document the refactor architecture and test strategy

## Non-Goals

- No Next.js migration
- No TanStack Query migration
- No redesign or visual polish pass
- No backend API changes
- No state model replacement with Zustand, Redux, or other stores
- No opportunistic product changes hidden inside the refactor

## Approved Approach

Use feature-domain modularization while keeping a single public app context.

This means:

- `AppProvider` and `useApp()` stay as the public frontend state contract
- `AppContext.tsx` becomes an orchestrator instead of a monolith
- `services/api.ts` is decomposed into domain services behind a stable compatibility surface
- large route files are split into feature-local modules while keeping their page exports and rendered markup behavior intact
- pure logic is extracted first so risky behavior can be characterized before JSX-heavy files are split

This approach gives the project cleaner ownership boundaries without changing how the application fundamentally works.

## Current Problems To Fix

### Context Monolith

[C:\xampp\htdocs\group8\frontend\src\app\context\AppContext.tsx](C:/xampp/htdocs/group8/frontend/src/app/context/AppContext.tsx) currently mixes:

- auth session persistence
- API bootstrap loading
- CRUD actions for users, classes, exams, and submissions
- grading rules
- local optimistic updates
- selectors
- local storage behavior

This makes the provider hard to reason about, risky to edit, and inconsistent with a maintainable senior-level architecture.

### Service Monolith

[C:\xampp\htdocs\group8\frontend\src\app\services\api.ts](C:/xampp/htdocs/group8/frontend/src/app/services/api.ts) contains:

- HTTP primitives
- base URL resolution
- every backend domain service
- endpoint documentation payloads
- API-specific types for unrelated domains

The file is too large and too cross-cutting to remain the default home for all backend interaction code.

### Page Monoliths

The largest route files currently mix orchestration, rules, formatting, event handling, and presentational JSX in one place.

The most urgent refactor targets are:

- [C:\xampp\htdocs\group8\frontend\src\app\pages\student\TakeExam.tsx](C:/xampp/htdocs/group8/frontend/src/app/pages/student/TakeExam.tsx)
- [C:\xampp\htdocs\group8\frontend\src\app\pages\teacher\TeacherExams.tsx](C:/xampp/htdocs/group8/frontend/src/app/pages/teacher/TeacherExams.tsx)
- [C:\xampp\htdocs\group8\frontend\src\app\pages\teacher\TeacherViolationCases.tsx](C:/xampp/htdocs/group8/frontend/src/app/pages/teacher/TeacherViolationCases.tsx)
- [C:\xampp\htdocs\group8\frontend\src\app\pages\admin\AdminApiReference.tsx](C:/xampp/htdocs/group8/frontend/src/app/pages/admin/AdminApiReference.tsx)
- [C:\xampp\htdocs\group8\frontend\src\app\components\analytics\QuestionAnalyticsSection.tsx](C:/xampp/htdocs/group8/frontend/src/app/components/analytics/QuestionAnalyticsSection.tsx)

## Architecture Principles

### Public Contract Stability

The following contracts stay stable during the refactor:

- `useApp()` remains the primary consumer hook for app state and actions
- existing route paths remain unchanged
- page entry files in `pages/**` continue to export the route components used by `routes.tsx`
- frontend screens continue to render the same UI

### Exact UI Preservation

The UI must remain exactly as it is.

For this refactor, "exactly" means:

- same DOM structure for the existing components unless a purely mechanical extraction requires no observable output change
- same text and labels
- same Tailwind class composition unless a move requires line wrapping only
- same iconography
- same modal flows
- same button positions and state transitions
- same navigation behavior
- same anti-cheat prompts, timing behavior, and submission behavior

Refactoring may move code, but it may not redesign, rename, or restyle the product.

### Dependency Direction

Dependency direction should become:

`pages -> features -> shared components/lib/constants -> services/context`

with the following rules:

- `pages/**` owns route entry only
- `features/**` owns route-specific logic and UI composition
- `components/shared/**` only contains components shared across multiple features
- `services/**` owns backend communication
- `context/**` owns orchestration of the existing state model
- `constants/**` and `lib/**` own pure reusable logic

## Target Folder Ownership

### `pages/**`

`pages/**` remains the route-facing layer.

Each page file should become a thin entry module that:

- reads route params when needed
- performs high-level access checks and redirects
- composes its feature root
- avoids holding business rules, validation, or large render trees inline

### `features/**`

`features/**` becomes the primary home for route-local code.

Representative structure:

```text
frontend/src/app/features/
  student/
    take-exam/
      components/
      hooks/
      lib/
      constants.ts
      types.ts
  teacher/
    exams/
      components/
      hooks/
      lib/
      constants.ts
      types.ts
  teacher/
    violation-cases/
  admin/
    api-reference/
```

Each feature folder should hold:

- local presentational sections
- feature-only hooks
- local constants
- validation helpers
- feature-specific formatters or mappers
- narrowly scoped feature types when they are not app-wide

Anything used by only one route should not live in `components/shared`.

### `context/**`

`AppContext.tsx` remains the public entry point, but its internals should be split into composable modules.

Representative structure:

```text
frontend/src/app/context/
  AppContext.tsx
  app-context.types.ts
  app-context.storage.ts
  app-context.selectors.ts
  domains/
    auth-domain.ts
    user-domain.ts
    class-domain.ts
    exam-domain.ts
    submission-domain.ts
```

Responsibilities:

- `AppContext.tsx`
  - owns React state allocation
  - assembles domain actions/selectors
  - exposes the public provider and `useApp()`
- `app-context.types.ts`
  - central app-context public and internal types
- `app-context.storage.ts`
  - token and session storage keys
  - current-user persistence helpers
- `app-context.selectors.ts`
  - reusable selectors derived from current state
- `domains/*.ts`
  - one domain per file
  - receive state setters and service dependencies
  - return focused action groups

The provider should orchestrate domain modules, not embed the full implementation inline.

### `services/**`

Split backend access into domain-specific service files while preserving a stable compatibility layer.

Representative structure:

```text
frontend/src/app/services/
  api.ts
  http/
    request.ts
    base-url.ts
  auth.service.ts
  user.service.ts
  class.service.ts
  exam.service.ts
  result.service.ts
  report.service.ts
  accommodation.service.ts
  violation.service.ts
  docs.service.ts
```

Rules:

- `http/request.ts` owns the shared fetch helper
- service files own only their domain types and operations
- `services/api.ts` temporarily acts as a compatibility facade that re-exports domain service modules so the refactor can be incremental and low-risk

### `constants/**` and `lib/**`

Move pure reusable logic here when it crosses feature boundaries.

Examples:

- storage keys
- grading thresholds
- status labels
- route metadata
- date helpers
- form normalization helpers
- shared formatting logic

## Feature-Specific Refactor Rules

### Student Take Exam

`TakeExam` should be split into feature-local modules while preserving its exact UI and behavior.

Candidate seams:

- anti-cheat constants
- answer tracking helpers
- telemetry/session helpers
- timer formatting
- question navigation helpers
- submit payload shaping
- start/submitted/active screen sections

The existing anti-cheat state machine in:

[C:\xampp\htdocs\group8\frontend\src\app\pages\student\ExamFocusViolationState.ts](C:/xampp/htdocs/group8/frontend/src/app/pages/student/ExamFocusViolationState.ts)

should remain a pure seam, but frontend verification for it must move to Playwright-driven browser scenarios rather than frontend unit tests.

### Teacher Exams

`TeacherExams` should be split into:

- exam form validation and normalization helpers
- status transition helpers
- modal orchestration hooks
- exam list item sections
- question editor sections
- violation viewer section

The route file should become a thin feature container instead of owning the full create/edit flow inline.

### Teacher Violation Cases

Split filtering, lookup, outcome mapping, and section rendering into feature-local modules.

### Admin API Reference

Separate:

- docs verification fetching
- endpoint metadata rendering helpers
- filtering/search helpers
- presentational sections

### Analytics Section

Keep the shared analytics UI exact, but move chart data shaping, grouping, and formatting logic into focused helpers.

## Migration Strategy

### Phase 1: Compatibility Scaffolding

- Create target folders for `features`, `context` internals, `services`, `constants`, and `lib`
- Retain `services/api.ts` as a compatibility-oriented facade during the split
- Introduce shared storage constants and pure helpers first

### Phase 2: Extract Pure Logic First

Extract logic that can move without changing render structure:

- validators
- selectors
- grading helpers
- storage helpers
- date/time helpers
- exam status helpers
- payload-shaping helpers
- anti-cheat transition helpers

This phase reduces behavioral risk before JSX-heavy decomposition begins.

### Phase 3: Split The Largest Features

Refactor the highest-risk monoliths one at a time:

1. `TakeExam`
2. `TeacherExams`
3. `TeacherViolationCases`
4. `AdminApiReference`
5. `QuestionAnalyticsSection`

Each refactor should keep the exported route component stable while moving internal logic into feature-owned modules.

### Phase 4: Slim Down App Context

Move `AppContext` logic into domain modules without changing the public context value shape.

The provider should still expose the same state and actions, but the implementation should be composed from smaller files with explicit ownership.

### Phase 5: Shared Component Cleanup

Move feature-specific code out of `components/shared/**`.

Only components with multiple real consumers should remain in shared space.

## Invariants

These rules must hold for the full implementation:

- no route changes
- no UI changes
- no copy changes
- no class name strategy changes
- no replacement of context as the state model
- no hidden product changes
- no API contract changes
- no refactor that requires consumers to relearn how the app is wired

## Frontend Testing Standard

All frontend testing must use Playwright.

This requirement replaces ad hoc frontend unit-style testing for the refactor scope.

### Required Tooling Direction

If Playwright is not already configured, the frontend refactor must add:

- Playwright dependency and config
- deterministic frontend test scripts in `frontend/package.json`
- a stable folder structure for E2E specs, fixtures, and documented test cases

Recommended structure:

```text
frontend/
  playwright.config.ts
  tests/
    e2e/
      auth/
      student/
      teacher/
      admin/
    fixtures/
    test-cases/
      auth.md
      student-take-exam.md
      teacher-exams.md
      teacher-violation-cases.md
      admin-api-reference.md
```

### Documentation Standard For Test Cases

Frontend Playwright coverage must be "extremely well-documented."

Each covered scenario must have a documented case entry with:

- case ID
- feature name
- user persona
- purpose/risk being covered
- preconditions
- test data assumptions
- step-by-step actions
- expected results
- failure signals or regression symptoms
- mapped Playwright spec/test name

The test documentation should live in `frontend/tests/test-cases/*.md` so reviewers can understand coverage without reading code first.

### Playwright Spec Standard

Every Playwright test should:

- use descriptive titles with the matching case ID
- focus on observable user behavior
- avoid hiding intent in overly abstract helpers
- keep assertions explicit and easy to audit
- include comments only where they add clarity to a complex flow

Example title style:

- `FE-TAKE-001 student auto-submits after the third focus violation`
- `FE-EXAMS-003 teacher cannot save an exam whose question marks exceed total marks`

### Required Coverage For This Refactor

At minimum, Playwright coverage should document and verify:

- auth login/register happy paths that the refactor touches
- student exam start/submission flows
- anti-cheat violation behavior visible through the UI
- teacher exam create/edit/delete flows
- teacher exam validation failures
- teacher violation case review flows touched by the refactor
- admin API reference rendering/filtering flows touched by the refactor

### Existing Frontend Test Alignment

The current frontend unit-style file:

[C:\xampp\htdocs\group8\frontend\src\app\pages\student\ExamFocusViolationState.test.ts](C:/xampp/htdocs/group8/frontend/src/app/pages/student/ExamFocusViolationState.test.ts)

does not match the approved frontend testing standard.

As part of the refactor, its coverage intent should be replaced or superseded by documented Playwright browser scenarios that verify the same behavior from the user-facing exam flow.

## Documentation Deliverables

- this design spec
- a follow-up implementation plan
- Playwright test-case documents for the refactor slices that gain coverage
- any necessary frontend README updates for new test commands

## Acceptance Criteria

The refactor is complete when:

- the frontend still behaves the same to the user
- the frontend still looks exactly the same
- `useApp()` remains the public state surface
- `AppContext.tsx` no longer owns all implementation detail inline
- `services/api.ts` is no longer the true implementation home for all backend domains
- the major page monoliths are decomposed into coherent feature-local modules
- shared code is actually shared, not feature-specific
- frontend tests run through Playwright only
- Playwright test cases are documented clearly enough for a reviewer to audit intent without reverse-engineering the specs
