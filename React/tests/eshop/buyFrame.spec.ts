import { test, expect } from '@playwright/test';
import { setECoins } from './crud/ECoins';
import { revertFramePurchases, revertFrameSelection } from './crud/Frame';

test('buying a frame', async ({ page }) => {
  await dbSetup();
  await page.goto('/eshop');

  await page.getByRole('button', { name: 'Buy' }).first().click();
  await page.getByRole('button', { name: 'Confirm Purchase' }).click();
  await page.getByRole('button', { name: 'Use Now' }).click();

  const div = page.locator('div[style="width: 40px; height: 40px;"]');

  // Localizar imgs dentro del div que NO tengan alt="tester"
  const imgValida = div.locator('img:not([alt="tester"])');
  await expect(imgValida).not.toHaveCount(0);
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
  await setECoins(9999);
}

async function dbTeardown() {
  await revertFramePurchases();
  await revertFrameSelection();
  await setECoins(0);
}
