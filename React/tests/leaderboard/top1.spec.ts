import { getHighestPoints, setTestProfilePoints } from './crud/TestProfile';
import { test, expect } from '@playwright/test';

let testerPoints: number;
test.beforeAll(async () => {
  const highestPoints = await getHighestPoints();
  testerPoints = highestPoints + 1;
  await setTestProfilePoints(testerPoints);
});

test('Expect top test profile to be top 1', async ({ page }) => {
  await page.goto('/ranking');
  await expect(page.getByText('#1', { exact: true })).toBeVisible();

  const formattedPoints = testerPoints.toLocaleString('en-US');
  await expect(page.getByText(`@tester${formattedPoints}YOU1`)).toBeVisible();
});

test.afterAll(async () => {
  await setTestProfilePoints(0);
});
