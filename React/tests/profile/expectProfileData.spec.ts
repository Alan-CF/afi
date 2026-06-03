import {
  setTestProfileData,
  resetProfile,
  getTestProfile,
  type Profile,
} from './crud/testProfile';
import { test, expect } from '@playwright/test';

let testProfileId: string;
let testingProfile: Profile;

test.beforeAll(async () => {
  testProfileId = await getTestProfile();

  console.log('Fetched test profile ID:', testProfileId);

  if (!testProfileId) {
    console.error('An error occurred while fetching the test profile ID.');
    throw new Error('Test profile ID is not available. Cannot run tests.');
  }

  testingProfile = await setTestProfileData(testProfileId);

  if (!testingProfile) {
    console.error('An error occurred while setting test profile data.');
    throw new Error('Test profile data is not available. Cannot run tests.');
  }
});

test('Expect profile data to be displayed correctly', async ({ page }) => {
  page.goto('/myprofile');
  await expect(
    page.getByRole('heading', { name: testingProfile.name })
  ).toBeVisible();
  await expect(page.getByText(`@${testingProfile.username}`)).toBeVisible();
  await expect(
    page.getByText(`${testingProfile.streak}`, { exact: true })
  ).toBeVisible();

  await expect(page.getByText(testingProfile.caption!)).toBeVisible();
});

test.afterAll(async () => {
  await resetProfile(testProfileId);
});
