import { seedTestQuiz } from './crud/quizCreator';
import { deleteTestQuiz } from './crud/quizCleaner';
import { test, expect } from '@playwright/test';

test.beforeAll(async () => {
  await seedTestQuiz();
});

test('answer a quiz and verify result', async ({ page }) => {
  await page.goto('/quizzes');
  await page
    .getByRole('button', { name: '[TEST] Quiz Functionality' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Start Quiz!' }).click();
  await page.getByRole('button', { name: '[Q1-A] Option that leans' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '[Q2-A] Option that leans' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '[Q3-A] Option that leans' }).click();
  await page.getByRole('button', { name: 'Send Answers' }).click();
  await expect(
    page.getByRole('heading', { name: '[RESULT A] Test Result Alpha' })
  ).toBeVisible();
});

test.afterAll(async () => {
  await deleteTestQuiz();
});
