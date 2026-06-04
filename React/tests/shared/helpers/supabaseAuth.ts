import { supabase } from './supabaseClient';

function getSupabaseAuthStorageKey() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL in test environment');
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

export async function getSupabaseSession() {
  const email = process.env.TEST_USER_EMAIL?.trim();
  const password = process.env.TEST_USER_PASSWORD?.trim();

  if (!email) {
    throw new Error('Missing TEST_USER_EMAIL in test environment');
  }

  if (!password) {
    throw new Error('Missing TEST_USER_PASSWORD in test environment');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error('Supabase did not return a session for the test user');
  }

  return {
    authStorageKey: getSupabaseAuthStorageKey(),
    session: data.session,
  };
}
