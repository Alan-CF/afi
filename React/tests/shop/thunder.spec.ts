import { test } from '@playwright/test';
import {
  createMockPricedProduct,
  deleteMockPricedProduct,
} from './crud/MockPricedProduct';

// UNFFINISHED TEST - NOT WORKING YET
test('Thunder recomends products', async ({ page }) => {
  await dbSetup();
  await page.goto('/shop');
  await page.getByRole('button', { name: 'Open chat' }).click();
  await page.getByRole('textbox', { name: 'Ask ThunderAI...' }).click();
  await page
    .getByRole('textbox', { name: 'Ask ThunderAI...' })
    .fill('I am a tester. Recomend the test product');
  await page
    .locator('form')
    .getByRole('button')
    .filter({ hasText: /^$/ })
    .click();
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
  await createMockPricedProduct();
}

async function dbTeardown() {
  await deleteMockPricedProduct();
}
