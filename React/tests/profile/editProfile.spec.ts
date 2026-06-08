import { getTestProfile, resetProfile } from './crud/testProfile';
import { test, expect } from '@playwright/test';

const testProfileId = await getTestProfile();

test('Edit Profile', async ({ page }) => {
  await dbSetup();

  page.goto('/myprofile');

  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('change');
  await page.getByRole('textbox', { name: 'username' }).click();
  await page
    .getByRole('textbox', { name: 'username' })
    .press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'username' }).fill('change');
  await page
    .getByRole('textbox', { name: 'Let us get to know you! Write' })
    .click();
  await page
    .getByRole('textbox', { name: 'Let us get to know you! Write' })
    .press('ControlOrMeta+a');
  await page
    .getByRole('textbox', { name: 'Let us get to know you! Write' })
    .fill('change');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'change' })).toBeVisible();
  await expect(page.getByText('@change')).toBeVisible();
  await expect(page.getByText('change').nth(2)).toBeVisible();
});

test.afterAll(async () => {
  await dbTeardown();
});

async function dbSetup() {
  if (!testProfileId) {
    console.error('An error occurred while fetching the test profile ID.');
    throw new Error('Test profile ID is not available. Cannot run tests.');
  }
  await resetProfile(testProfileId);
}

async function dbTeardown() {
  await resetProfile(testProfileId);
}
