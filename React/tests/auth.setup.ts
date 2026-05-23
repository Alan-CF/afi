import { test as setup, request } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('Auth', async ({ page }) => {
  await page.goto('/');
  const session = await getSupabaseSession();
  await page.evaluate((sessionData) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
  }, session);
  await page.context().storageState({ path: authFile });
});

async function getSupabaseSession() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const testUserEmail = process.env.TEST_USER_EMAIL;
  const testUserPassword = process.env.TEST_USER_PASSWORD;

  const apiRequest = await request.newContext();
  const response = await apiRequest.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: supabaseAnonKey ?? '',
        'Content-Type': 'application/json',
      },
      data: {
        email: testUserEmail,
        password: testUserPassword,
      },
    }
  );

  const json = await response.json();
  return json;
}
