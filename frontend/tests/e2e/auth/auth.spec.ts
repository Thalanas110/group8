import { expect, test } from '@playwright/test';
import { createAllData, mockLogin, mockRegister, users } from '../../fixtures/mock-api';

test('FE-AUTH-001 user can sign in and land on the teacher workspace', async ({ page }) => {
  await mockLogin(page, users.teacher, createAllData());

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('you@school.edu').fill(users.teacher.email);
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/teacher$/);
  await expect(page.getByText('Teacher Portal')).toBeVisible();
  await expect(page.getByRole('banner').getByText(users.teacher.name)).toBeVisible();
});

test('FE-AUTH-002 user can register as a student and land on the student workspace', async ({ page }) => {
  await mockRegister(page, users.student, createAllData());

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('John Doe').fill(users.student.name);
  await page.getByPlaceholder('you@example.com').fill(users.student.email);
  await page.getByPlaceholder('e.g. Computer Science').fill(users.student.department ?? '');
  await page.getByPlaceholder('Minimum 6 characters').fill('password123');
  await page.getByPlaceholder('Re-enter your password').fill('password123');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByText('Student Portal')).toBeVisible();
  await expect(page.getByRole('banner').getByText(users.student.name)).toBeVisible();
});
