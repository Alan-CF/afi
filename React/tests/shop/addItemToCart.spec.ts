import { test, expect } from '@playwright/test';
import {
  createMockPricedProduct,
  deleteMockPricedProduct,
} from './crud/MockPricedProduct';
import { clearCart } from './crud/Cart';

test('Add item to cart', async ({ page }) => {
  await dbSetup();
  await page.goto('/');
  await page.getByRole('link', { name: 'Shop', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Wear the game beyond the court' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'View all products' }).click();
  await expect(
    page.getByRole('button', { name: 'Test Product' }).first()
  ).toBeVisible();
  await page.getByRole('button', { name: 'Test Product' }).first().click();
  await expect(page.getByText('$99.99')).toBeVisible();
  await page.getByRole('button', { name: 'option b' }).click();
  await page.getByRole('button', { name: 'option 4' }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(
    page.getByRole('button', { name: 'Added to Cart' })
  ).toBeVisible();
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
  await createMockPricedProduct();
}

async function dbTeardown() {
  await clearCart();
  await deleteMockPricedProduct();
}
