import { test, expect } from '@playwright/test';
import {
  createMockPricedProduct,
  deleteMockPricedProduct,
} from './crud/MockPricedProduct';

test('main home search bar', async ({ page }) => {
  await dbSetup();
  await page.goto('/shop');

  await page.getByRole('button', { name: 'Search products' }).click();
  await page
    .getByRole('textbox', { name: 'Search products' })
    .fill('Test Product');
  await page.getByRole('textbox', { name: 'Search products' }).press('Enter');

  await expect(
    page.getByRole('button', { name: 'Test Product' }).first()
  ).toBeVisible();
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
  await createMockPricedProduct();
  console.log('Mock priced product created for search bar test');
}

async function dbTeardown() {
  await deleteMockPricedProduct();
}
