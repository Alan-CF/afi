import os

from supabase import Client, create_client


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.")

supabase: Client = create_client(supabase_url, supabase_key)
