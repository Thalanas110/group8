# Teacher Violation Case Review Cases

## FE-VCASE-001

- Feature: Teacher Violation Cases
- Persona: Teacher
- Purpose: Preserve the teacher review workflow while splitting violation queue logic and modal rendering into feature modules.
- Preconditions: A teacher session exists, the teacher owns the selected exam, and violation/case APIs return at least one reviewable student.
- Test Data: Two raw violation events plus one pending case record for `student-1`.
- Steps:
  1. Open `/teacher/violation-cases`.
  2. Confirm the student row is visible in the queue.
  3. Click `Review`.
- Expected Results:
  1. The violation review page renders.
  2. The student appears in the queue table.
  3. The review modal opens with the correct student name.
  4. Raw violation rows are visible inside the modal.
- Failure Signals:
  1. Queue rows do not render.
  2. Clicking `Review` does nothing.
  3. The wrong student data appears in the modal.
- Playwright Mapping: `tests/e2e/teacher/teacher-violation-cases.spec.ts > FE-VCASE-001 teacher can open and review a student violation case`
