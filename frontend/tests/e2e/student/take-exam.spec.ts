import { expect, test } from '@playwright/test';
import {
  createAllData,
  mockDataAll,
  mockSubmitExam,
  mockViolationReports,
  seedSession,
  users,
} from '../../fixtures/mock-api';

test('FE-TAKE-001 student sees the anti-cheat rules before starting an exam', async ({ page }) => {
  await seedSession(page, users.student);
  await mockDataAll(page, createAllData());

  await page.goto('/student/exams', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'My Exams' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Exam' }).click();
  await expect(page.getByRole('heading', { name: 'Logic Midterm' })).toBeVisible();
  await expect(page.getByText(/Switching tabs, minimising the window, or leaving this page will be recorded as a violation\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Exam' })).toBeVisible();
  await expect(page.getByText(/After 3 violation\(s\) your exam will be automatically submitted\./)).toBeVisible();
});

test('FE-TAKE-002 student is auto-submitted after the third anti-cheat violation', async ({ page }) => {
  await seedSession(page, users.student);
  await mockDataAll(page, createAllData());
  await mockSubmitExam(page);
  await mockViolationReports(page);

  await page.goto('/student/exams', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start Exam' }).click();
  await page.getByRole('button', { name: 'Start Exam' }).click();

  await expect(page.getByText('Q1 of 2')).toBeVisible();
  await page.waitForTimeout(3200);

  for (const violationNumber of [1, 2] as const) {
    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    });

    await expect(page.getByRole('heading', { name: 'Tab Switch Detected!' })).toBeVisible();
    await expect(page.getByText(new RegExp(`Violation ${violationNumber} of 3`))).toBeVisible();
    await page.getByRole('button', { name: /I Understand/ }).click();
  }

  await page.evaluate(() => {
    document.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  });

  await expect(page.getByRole('heading', { name: 'Exam Submitted!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Exams' })).toBeVisible();
});
