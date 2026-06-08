-- =========================================================
-- PER-ROOM MOCK GAME SYNC
-- The live mock game shown inside a room is now stored on the room row so
-- every device that opens the same room renders the exact same match and
-- clock. Three columns describe the control state:
--   * mock_match_id      -> which mock match is playing ('full' | 'short')
--   * mock_anchor_ms     -> epoch ms the clock was anchored to (null = the
--                           shared free-running epoch, i.e. nobody has taken
--                           manual control yet)
--   * mock_offset_seconds-> seconds offset applied from the anchor (used by
--                           "Last Quarter" style jumps)
--
-- Only the room owner may change these. The rooms_update_members policy lets
-- any accepted member UPDATE the rooms row (for the shared photo), so we can
-- NOT rely on RLS alone to keep this owner-only. Instead writes go through a
-- security-definer RPC that checks is_owner_of_room(), mirroring
-- remove_room_match().
-- =========================================================

alter table public.rooms
  add column if not exists mock_match_id text not null default 'full',
  add column if not exists mock_anchor_ms bigint,
  add column if not exists mock_offset_seconds integer not null default 0;

comment on column public.rooms.mock_match_id is
  'Active mock match id (full | short). Owner-controlled via set_room_mock_control.';
comment on column public.rooms.mock_anchor_ms is
  'Epoch ms anchor for the mock clock; null = shared free-running epoch.';
comment on column public.rooms.mock_offset_seconds is
  'Seconds offset applied to the mock clock from the anchor.';

create or replace function public.set_room_mock_control(
  target_room_id bigint,
  p_match_id text,
  p_anchor_ms bigint,
  p_offset_seconds integer
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.is_owner_of_room(target_room_id) then
    raise exception 'not_room_owner' using errcode = '42501';
  end if;

  if p_match_id not in ('full', 'short') then
    raise exception 'invalid_match_id';
  end if;

  update public.rooms
  set mock_match_id = p_match_id,
      mock_anchor_ms = p_anchor_ms,
      mock_offset_seconds = coalesce(p_offset_seconds, 0)
  where id = target_room_id;
end;
$function$;

revoke all on function public.set_room_mock_control(bigint, text, bigint, integer) from public;
grant execute on function public.set_room_mock_control(bigint, text, bigint, integer) to authenticated;

-- Realtime: rooms is already in the supabase_realtime publication (added for
-- match visibility), but ensure it so members receive mock control updates.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end
$$;
