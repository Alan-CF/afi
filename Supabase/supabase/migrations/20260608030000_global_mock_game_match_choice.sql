-- Let owners restart either the short clutch mock or the full mock game.

alter table public.mock_game_state
add column if not exists match_id text not null default 'short';

update public.mock_game_state
set match_id = 'short'
where match_id is null
   or match_id not in ('short', 'full');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mock_game_state_match_id_check'
      and conrelid = 'public.mock_game_state'::regclass
  ) then
    alter table public.mock_game_state
    add constraint mock_game_state_match_id_check
    check (match_id in ('short', 'full'));
  end if;
end
$$;

drop function if exists public.get_mock_game_state();

create function public.get_mock_game_state()
 returns table (
  match_id text,
  anchor_ms bigint,
  updated_at timestamptz,
  server_now_ms bigint
 )
 language sql
 security definer
 set search_path to 'public'
as $function$
  select
    m.match_id,
    m.anchor_ms,
    m.updated_at,
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint as server_now_ms
  from public.mock_game_state m
  where m.id = 1;
$function$;

create or replace function public.reset_global_mock_game(p_match_id text)
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_anchor_ms bigint;
  v_updated_at timestamptz;
  v_match_id text := coalesce(p_match_id, 'short');
begin
  if v_match_id not in ('short', 'full') then
    raise exception 'invalid_mock_match' using errcode = '22023';
  end if;

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

  insert into public.mock_game_state (id, match_id, anchor_ms, updated_at)
  values (1, v_match_id, v_anchor_ms, v_updated_at)
  on conflict (id) do update
  set match_id = excluded.match_id,
      anchor_ms = excluded.anchor_ms,
      updated_at = excluded.updated_at;

  return v_anchor_ms;
end;
$function$;

create or replace function public.reset_global_mock_game()
 returns bigint
 language sql
 security definer
 set search_path to 'public'
as $function$
  select public.reset_global_mock_game('short');
$function$;

create or replace function public.reset_global_mock_game(p_anchor_ms bigint)
 returns bigint
 language sql
 security definer
 set search_path to 'public'
as $function$
  select public.reset_global_mock_game('short');
$function$;

revoke all on function public.get_mock_game_state() from public;
grant execute on function public.get_mock_game_state() to authenticated;
revoke all on function public.reset_global_mock_game(text) from public;
grant execute on function public.reset_global_mock_game(text) to authenticated;
revoke all on function public.reset_global_mock_game() from public;
grant execute on function public.reset_global_mock_game() to authenticated;
revoke all on function public.reset_global_mock_game(bigint) from public;
grant execute on function public.reset_global_mock_game(bigint) to authenticated;
