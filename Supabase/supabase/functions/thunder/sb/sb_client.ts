import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

function get_supabase_key() {
  return Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SB_PUBLISHABLE_KEY");
}

export function get_supabase_client(jwt_token = ""): SupabaseClient {
  const supabase_url = Deno.env.get("SUPABASE_URL");
  const supabase_key = get_supabase_key();

  if (!supabase_url || !supabase_key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.",
    );
  }

  const has_auth = jwt_token.trim().length > 0;

  return createClient(supabase_url, supabase_key, has_auth
    ? {
      global: {
        headers: {
          Authorization: jwt_token,
        },
      },
    }
    : undefined);
}
