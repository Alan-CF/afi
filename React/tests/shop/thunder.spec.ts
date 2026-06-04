import { test, expect } from '@playwright/test';
import { clearThunderConversation } from './crud/Thunder';

test('Thunder comunicates', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('button', { name: 'Open chat' }).click();
  await page.getByRole('textbox', { name: 'Ask ThunderAI...' }).click();
  await page
    .getByRole('textbox', { name: 'Ask ThunderAI...' })
    .fill('Hello I need help.');
  await page
    .locator('form')
    .getByRole('button')
    .filter({ hasText: /^$/ })
    .click();

  const container = page
    .locator('div')
    .filter({ hasText: 'Welcome to ThunderAI Chat!' })
    .nth(4);
  const paragraphs = container.locator('p');

  await expect(async () => {
    const count = await paragraphs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  }).toPass({ timeout: 30_000 });
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbTeardown() {
  await clearThunderConversation();
}
