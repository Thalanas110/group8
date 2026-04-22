import { expect, test } from '@playwright/test';
import {
  createAllData,
  mockDataAll,
  mockTeacherViolationQueue,
  seedSession,
  users,
} from '../../fixtures/mock-api';

test('FE-VCASE-001 teacher can open and review a student violation case', async ({ page }) => {
  await seedSession(page, users.teacher);
  await mockDataAll(page, createAllData());
  await mockTeacherViolationQueue(page);

  await page.goto('/teacher/violation-cases', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Violation Case Review' })).toBeVisible();
  await page.locator('select').selectOption('exam-1');
  await expect(page.getByText(users.student.name)).toBeVisible();
  await page.getByRole('button', { name: 'Review' }).click();

  await expect(page.getByRole('heading', { name: `Review Case — ${users.student.name}` })).toBeVisible();
  await expect(page.getByText('Raw Violations (2)')).toBeVisible();
});
