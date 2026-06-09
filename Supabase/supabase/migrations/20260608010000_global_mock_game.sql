-- =========================================================
-- GLOBAL MOCK GAME
-- One shared mock game for the entire app. A single-row table holds the clock
-- anchor; resetting it restarts the short "clutch" match for every room on
-- every device at once. Only users who own at least one room may reset it
-- (enforced by the reset_global_mock_game RPC).
--
-- This supersedes the earlier per-room experiment, whose columns / RPC are
-- dropped below if they were ever applied.
-- =========================================================

-- 1) Clean up the per-room experiment.
drop function if exists public.set_room_mock_control(bigint, text, bigint, integer);
alter table public.rooms drop column if exists mock_match_id;
alter table public.rooms drop column if exists mock_anchor_ms;
alter table public.rooms drop column if exists mock_offset_seconds;

-- 2) Singleton table holding the shared clock anchor.
create table if not exists public.mock_game_state (
  id smallint primary key default 1,
  anchor_ms bigint,
  updated_at timestamptz not null default now(),
  constraint mock_game_state_singleton check (id = 1)
);

insert into public.mock_game_state (id, anchor_ms)
values (1, null)
on conflict (id) do nothing;

alter table public.mock_game_state enable row level security;

-- Any signed-in user can read the shared state.
drop policy if exists "mock_game_state_select" on public.mock_game_state;
create policy "mock_game_state_select"
on public.mock_game_state
as permissive
for select
to authenticated
using (true);

-- 3) Reset RPC. Only room owners may trigger it; writes happen here (not via a
--    table policy) so the ownership check is enforced server-side.
create or replace function public.reset_global_mock_game(p_anchor_ms bigint)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.rooms r where r.owner_profile_id = auth.uid()
  ) and not exists (
    select 1
    from public.room_members rm
    where rm.profile_id = auth.uid()
      and rm.role = 'owner'
      and rm.status = 'accepted'
  ) then
    raise exception 'not_room_owner' using errcode = '42501';
  end if;

  update public.mock_game_state
  set anchor_ms = p_anchor_ms,
      updated_at = now()
  where id = 1;
end;
$function$;

revoke all on function public.reset_global_mock_game(bigint) from public;
grant execute on function public.reset_global_mock_game(bigint) to authenticated;

-- 4) Realtime so every device restarts together.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mock_game_state'
  ) then
    alter publication supabase_realtime add table public.mock_game_state;
  end if;
end
$$;
