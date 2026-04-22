import { expect, test } from '@playwright/test';
import {
  createAllData,
  exams,
  mockDataAll,
  seedSession,
  users,
} from '../../fixtures/mock-api';

test('FE-GRADE-001 teacher can open a pending submission in the grading workspace', async ({ page }) => {
  await seedSession(page, users.teacher);
  await mockDataAll(page, createAllData({
    submissions: [
      {
        id: 'submission-1',
        examId: exams.logicMidterm.id,
        studentId: users.student.id,
        answers: [
          { questionId: exams.logicMidterm.questions[0].id, answer: exams.logicMidterm.questions[0].correctAnswer ?? '' },
          { questionId: exams.logicMidterm.questions[1].id, answer: 'A contradiction is false in every valuation because it cannot be satisfied.' },
        ],
        submittedAt: '2026-04-22T10:00:00Z',
        status: 'submitted',
      },
    ],
  }));

  await page.goto('/teacher/grade', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Grade Exams' })).toBeVisible();
  await expect(page.getByText('1 submission awaiting your review')).toBeVisible();
  await page.getByRole('button', { name: 'Grade', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Grade Submission' })).toBeVisible();
  await expect(page.getByText(users.student.name, { exact: true })).toBeVisible();
  await expect(page.getByText(exams.logicMidterm.title, { exact: true })).toBeVisible();
  await expect(page.getByText("Student's Answer").first()).toBeVisible();
  await expect(page.locator('input[type="number"]').last()).toBeVisible();
  await expect(page.locator('textarea')).toBeVisible();
});
