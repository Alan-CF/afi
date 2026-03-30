import os

from supabase import Client, create_client


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(supabase_url, supabase_key)
