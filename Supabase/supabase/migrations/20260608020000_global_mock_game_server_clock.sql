-- Keep the shared mock game synchronized from Supabase server time.
-- This migration is intentionally additive/replacing so it fixes databases
-- where 20260608010000_global_mock_game.sql was already applied.

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
alter table public.mock_game_state replica identity full;

drop policy if exists "mock_game_state_select" on public.mock_game_state;
create policy "mock_game_state_select"
on public.mock_game_state
as permissive
for select
to authenticated
using (true);

create or replace function public.get_mock_game_state()
 returns table (
  anchor_ms bigint,
  updated_at timestamptz,
  server_now_ms bigint
 )
 language sql
 security definer
 set search_path to 'public'
as $function$
  select
    m.anchor_ms,
    m.updated_at,
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint as server_now_ms
  from public.mock_game_state m
  where m.id = 1;
$function$;

drop function if exists public.reset_global_mock_game();
drop function if exists public.reset_global_mock_game(bigint);

create function public.reset_global_mock_game()
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_anchor_ms bigint;
  v_updated_at timestamptz;
begin
  v_updated_at := clock_timestamp();
  v_anchor_ms := floor(extract(epoch from v_updated_at) * 1000)::bigint;

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

  insert into public.mock_game_state (id, anchor_ms, updated_at)
  values (1, v_anchor_ms, v_updated_at)
  on conflict (id) do update
  set anchor_ms = excluded.anchor_ms,
      updated_at = excluded.updated_at;

  return v_anchor_ms;
end;
$function$;

-- Backward-compatible wrapper for already-deployed clients. The browser-provided
-- anchor is intentionally ignored so the server clock remains authoritative.
create function public.reset_global_mock_game(p_anchor_ms bigint)
 returns bigint
 language sql
 security definer
 set search_path to 'public'
as $function$
  select public.reset_global_mock_game();
$function$;

revoke all on function public.get_mock_game_state() from public;
grant execute on function public.get_mock_game_state() to authenticated;
revoke all on function public.reset_global_mock_game() from public;
grant execute on function public.reset_global_mock_game() to authenticated;
revoke all on function public.reset_global_mock_game(bigint) from public;
grant execute on function public.reset_global_mock_game(bigint) to authenticated;

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
