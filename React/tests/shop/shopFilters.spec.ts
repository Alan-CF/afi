import { test, expect } from '@playwright/test';
import { createMockProduct, deleteMockProduct } from './crud/MockProduct';

test('main home filters', async ({ page }) => {
  await dbSetup();
  await page.goto('/shop');

  await expect(
    page.getByRole('button', { name: 'Test Category' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Test Collection' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Test Player' })
  ).toBeVisible();
  await expect(page.getByText('99').first()).toBeVisible();
  await expect(page.getByText('Test Position')).toBeVisible();
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
  await createMockProduct();
}

async function dbTeardown() {
  await deleteMockProduct();
}
