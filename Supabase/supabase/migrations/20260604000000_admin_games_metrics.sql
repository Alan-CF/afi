drop policy if exists "quiz_attempts_select_admin" on public.quiz_attempts;
create policy "quiz_attempts_select_admin"
  on public.quiz_attempts
  as permissive
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "shoot_your_shot_games_select_admin" on public.shoot_your_shot_games;
create policy "shoot_your_shot_games_select_admin"
  on public.shoot_your_shot_games
  as permissive
  for select
  to authenticated
  using (public.is_admin());

grant select on table public.quiz_attempts to authenticated;
grant select on table public.shoot_your_shot_games to authenticated;
