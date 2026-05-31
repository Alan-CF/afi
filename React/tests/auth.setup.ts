import { test as setup, request } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

setup('auth', async ({ page }) => {
  await page.goto('/');
  const session = await getSupabaseSession();
  const supabaseId = process.env.SUPABASE_ID;

  await page.evaluate(
    ({ sessionData, supabaseId }) => {
      localStorage.setItem(
        `sb-${supabaseId}-auth-token`,
        JSON.stringify(sessionData)
      );
    },
    { sessionData: session, supabaseId }
  );
  await page.context().storageState({ path: authFile });

  await page.reload();
});

async function getSupabaseSession() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
