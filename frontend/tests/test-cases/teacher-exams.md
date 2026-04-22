# Teacher Exams Cases

## FE-EXAMS-001

- Feature: Teacher Exams
- Persona: Teacher
- Purpose: Preserve the create-exam validation path while refactoring the `TeacherExams` monolith into feature modules.
- Preconditions: A teacher session exists and the bootstrap payload includes at least one teacher-owned class.
- Test Data: Teacher account, one teacher-owned class, and the default create-exam modal state from the current UI.
- Steps:
  1. Open `/teacher/exams`.
  2. Click `Create Exam`.
  3. Fill valid title, description, dates, question text, and MCQ options.
  4. Lower the total marks below the allocated question marks.
  5. Click `Create Exam`.
- Expected Results:
  1. The modal opens successfully.
  2. Frontend validation blocks the submit.
  3. The validation message states that question points exceed total marks.
- Failure Signals:
  1. The create modal cannot be opened.
  2. The form submits without client validation.
  3. The validation message content changes unexpectedly.
- Playwright Mapping: `tests/e2e/teacher/teacher-exams.spec.ts > FE-EXAMS-001 teacher cannot save an exam whose question marks exceed total marks`
