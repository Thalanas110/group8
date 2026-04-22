# Teacher Grade Cases

## FE-GRADE-001

- Feature: Teacher Grade
- Persona: Teacher
- Purpose: Protect the grading workspace after `TeacherGrade` was decomposed into feature components and modal hooks.
- Preconditions: The teacher already has a valid session and at least one pending submission exists for one of the teacher's exams.
- Test Data: `exam-1` with one pending submission for `student-1`, delivered through the context bootstrap payload.
- Steps:
  1. Open `/teacher/grade`.
  2. Confirm the pending-submission summary is rendered.
  3. Open the pending submission with the `Grade` action.
  4. Confirm the grading workspace shows the student, exam, submitted answers, and grading controls.
- Expected Results:
  1. The grading dashboard renders for the teacher.
  2. The pending count reflects the seeded submission.
  3. The grading workspace opens when the submission is selected.
  4. At least one manual-score input and the teacher feedback field are visible.
- Failure Signals:
  1. The grading dashboard does not render.
  2. The submission row does not appear.
  3. The grading workspace fails to open.
  4. Manual grading controls or feedback input are missing.
- Playwright Mapping: `tests/e2e/teacher/teacher-grade.spec.ts > FE-GRADE-001 teacher can open a pending submission in the grading workspace`
