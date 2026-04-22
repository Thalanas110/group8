import { expect, test } from '@playwright/test';
import { createAllData, mockDataAll, seedSession, users } from '../../fixtures/mock-api';

test('FE-EXAMS-001 teacher cannot save an exam whose question marks exceed total marks', async ({ page }) => {
  let createExamCallCount = 0;

  await seedSession(page, users.teacher);
  await mockDataAll(page, createAllData());
  await page.route('**/api/exams', async route => {
    createExamCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/teacher/exams', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Create Exam' }).first().click();

  await page.getByPlaceholder('e.g. Algebra Midterm Exam').fill('Playwright Validation Exam');
  await page.getByPlaceholder('Brief exam description...').fill('Used to validate teacher exam form rules.');
  await page.locator('input[type="number"]').nth(1).fill('5');
  await page.locator('input[type="datetime-local"]').nth(0).fill('2026-04-24T09:00');
  await page.locator('input[type="datetime-local"]').nth(1).fill('2026-04-24T10:00');
  await page.getByPlaceholder('Question text...').fill('What is the logical inverse of p -> q?');
  await page.getByPlaceholder('Option 1').fill('¬p ∨ q');
  await page.getByPlaceholder('Option 2').fill('p ∧ q');
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole('button', { name: 'Create Exam' }).last().click();

  await expect(page.getByRole('heading', { name: 'Create New Exam' })).toBeVisible();
  await expect.poll(() => createExamCallCount).toBe(0);
});
