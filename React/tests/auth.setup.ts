import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabaseSession } from './shared/helpers/supabaseAuth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

setup('auth', async ({ page }) => {
  const session = await getSupabaseSession();
  await page.goto('/');

  await page.evaluate(
    ({ sessionData, authStorageKey }) => {
      localStorage.setItem(authStorageKey, JSON.stringify(sessionData));
    },
    { sessionData: session.session, authStorageKey: session.authStorageKey }
  );
  await page.context().storageState({ path: authFile });

  await page.reload();
});
