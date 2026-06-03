import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL in test environment');
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in test environment');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
