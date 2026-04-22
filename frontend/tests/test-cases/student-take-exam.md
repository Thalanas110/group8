# Student Take Exam Cases

## FE-TAKE-001

- Feature: Student Take Exam
- Persona: Student
- Purpose: Protect the student exam-entry screen and its anti-cheat contract during the refactor of the large `TakeExam` page.
- Preconditions: The student already has a valid session, belongs to a class, and can access a published exam with no prior submission.
- Test Data: `exam-1` served through the context bootstrap payload with a valid student session.
- Steps:
  1. Open `/student/exams`.
  2. Click the `Start Exam` action for the published exam.
  3. Confirm the exam entry screen is rendered.
  4. Confirm the anti-cheat warning copy is rendered before the exam starts.
- Expected Results:
  1. The exam title is visible.
  2. The `Start Exam` action is visible.
  3. The anti-cheat policy text explains that leaving the page is a violation.
  4. The anti-cheat policy text states that the exam auto-submits after the third violation.
- Failure Signals:
  1. The exam entry screen does not render.
  2. The anti-cheat copy disappears or changes unintentionally.
  3. The start action is missing.
- Playwright Mapping: `tests/e2e/student/take-exam.spec.ts > FE-TAKE-001 student sees the anti-cheat rules before starting an exam`

## FE-TAKE-002

- Feature: Student Take Exam
- Persona: Student
- Purpose: Protect the active anti-cheat enforcement path after the `TakeExam` page was decomposed into hooks and feature components.
- Preconditions: The student already has a valid session, can start a published exam, and the mocked submit plus violation endpoints are available.
- Test Data: `exam-1` from the context bootstrap payload plus mocked `POST /api/exams/:id/violations` and `POST /api/results/submit` responses.
- Steps:
  1. Open `/student/exams`.
  2. Enter the exam start screen and begin the exam.
  3. Wait for the anti-cheat cooldown window to expire.
  4. Trigger two right-click violations and acknowledge the warning modal each time.
  5. Trigger the third violation.
- Expected Results:
  1. The active exam workspace renders before violations are triggered.
  2. The warning modal appears for the first two violations and shows the running violation count.
  3. The third violation forces submission without further manual action from the student.
  4. The submitted-state screen is shown with the standard post-submit actions.
- Failure Signals:
  1. The active exam view does not render.
  2. The warning overlay does not appear or shows the wrong violation count.
  3. The third violation does not submit the exam.
  4. The submitted-state screen fails to appear.
- Playwright Mapping: `tests/e2e/student/take-exam.spec.ts > FE-TAKE-002 student is auto-submitted after the third anti-cheat violation`
