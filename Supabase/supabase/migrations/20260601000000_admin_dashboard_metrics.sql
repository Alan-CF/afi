create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists "fanatic_answers_select_admin" on public.fanatic_answers;
create policy "fanatic_answers_select_admin"
  on public.fanatic_answers
  as permissive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "fanatic_games_select_admin" on public.fanatic_games;
create policy "fanatic_games_select_admin"
  on public.fanatic_games
  as permissive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "room_messages_select_admin" on public.room_messages;
create policy "room_messages_select_admin"
  on public.room_messages
  as permissive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "fan_event_attendees_select_admin" on public.fan_event_attendees;
create policy "fan_event_attendees_select_admin"
  on public.fan_event_attendees
  as permissive
  for select
  to authenticated
  using (public.is_admin());

grant select on table public.fanatic_answers to authenticated;
grant select on table public.fanatic_games to authenticated;
grant select on table public.room_messages to authenticated;
grant select on table public.fan_event_attendees to authenticated;

create index if not exists fanatic_answers_created_at_idx
  on public.fanatic_answers (created_at);

create index if not exists fanatic_answers_game_id_created_at_idx
  on public.fanatic_answers (game_id, created_at);

create index if not exists fanatic_answers_profile_id_created_at_idx
  on public.fanatic_answers (profile_id, created_at);

create index if not exists room_messages_created_at_idx
  on public.room_messages (created_at);

create index if not exists fan_event_attendees_created_at_idx
  on public.fan_event_attendees (created_at);
