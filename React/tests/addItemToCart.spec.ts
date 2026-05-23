import { test, expect } from '@playwright/test';

test('Add item to cart', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Shop', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Wear the game beyond the court' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'View all products' }).click();
  await expect(
    page.getByRole('button', { name: 'Warriors Home Jersey 2024' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Warriors Home Jersey 2024' }).click();
  await expect(page.getByText('$')).toBeVisible();
  await page.getByRole('button', { name: 'gold' }).click();
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
});
