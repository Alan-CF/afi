-- ============================================================
-- Friends feature migration
-- Run in Supabase SQL Editor.
-- WARNING: Drops and recreates the friendships table.
--          Back up existing data first if needed.
-- ============================================================

-- 1. Drop old table (old columns were requester_id / addressee_id)
DROP TABLE IF EXISTS friendships CASCADE;

-- 2. Recreate with proper schema
CREATE TABLE friendships (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT friendships_no_self_invite
    CHECK (requester_profile_id <> receiver_profile_id),
  CONSTRAINT friendships_status_check
    CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- 3. Prevent duplicate active/pending pair (either direction)
CREATE UNIQUE INDEX friendships_unique_active_pair
  ON friendships (
    LEAST(requester_profile_id::text,  receiver_profile_id::text),
    GREATEST(requester_profile_id::text, receiver_profile_id::text)
  )
  WHERE status IN ('pending', 'accepted');

-- 4. Performance indexes
CREATE INDEX friendships_requester_idx ON friendships (requester_profile_id);
CREATE INDEX friendships_receiver_idx  ON friendships (receiver_profile_id);
CREATE INDEX friendships_status_idx    ON friendships (status);

-- 5. Username search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx
  ON profiles USING gin(username gin_trgm_ops);

-- 6. Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_own" ON friendships
  FOR SELECT USING (
    auth.uid() = requester_profile_id OR auth.uid() = receiver_profile_id
  );

CREATE POLICY "friendships_insert_as_requester" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_profile_id);

-- Only the receiver can accept or decline
CREATE POLICY "friendships_update_as_receiver" ON friendships
  FOR UPDATE
  USING (auth.uid() = receiver_profile_id)
  WITH CHECK (auth.uid() = receiver_profile_id);

-- Either participant can remove
CREATE POLICY "friendships_delete_as_participant" ON friendships
  FOR DELETE USING (
    auth.uid() = requester_profile_id OR auth.uid() = receiver_profile_id
  );

-- 8. Allow authenticated users to read public profile info (needed for search)
--    Skip if your profiles table already has a public SELECT policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_public_read'
  ) THEN
    CREATE POLICY "profiles_public_read" ON profiles
      FOR SELECT USING (true);
  END IF;
END;
$$;
