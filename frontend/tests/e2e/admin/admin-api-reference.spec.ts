import { expect, test } from '@playwright/test';
import {
  createAllData,
  mockDataAll,
  mockDocsVerify,
  seedSession,
  users,
} from '../../fixtures/mock-api';

test('FE-API-001 admin can verify documented endpoints from the API reference page', async ({ page }) => {
  await seedSession(page, users.admin);
  await mockDataAll(page, createAllData());
  await mockDocsVerify(page);

  await page.goto('/admin/api', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'API Reference + Verification' })).toBeVisible();
  await page.getByRole('button', { name: 'Verify Endpoints' }).click();

  await expect(page.getByText('13', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Last run:/)).toBeVisible();
});
