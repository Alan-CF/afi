alter table public.fan_events
  add column if not exists host_bio text;


drop policy if exists "fan_events public read" on public.fan_events;
create policy "fan_events public read"
  on public.fan_events
  for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "fan_events authenticated link access" on public.fan_events;
create policy "fan_events authenticated link access"
  on public.fan_events
  for select
  to authenticated
  using (true);


drop policy if exists "fan_event_images public read" on public.fan_event_images;
create policy "fan_event_images public read"
  on public.fan_event_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.fan_events
      where fan_events.id = fan_event_images.fan_event_id
        and fan_events.is_public = true
    )
  );

drop policy if exists "fan_event_images authenticated link access" on public.fan_event_images;
create policy "fan_event_images authenticated link access"
  on public.fan_event_images
  for select
  to authenticated
  using (true);


drop policy if exists "fan_event_attendees public event read" on public.fan_event_attendees;
create policy "fan_event_attendees public event read"
  on public.fan_event_attendees
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.fan_events
      where fan_events.id = fan_event_attendees.fan_event_id
        and fan_events.is_public = true
    )
  );

drop policy if exists "fan_event_attendees authenticated link access" on public.fan_event_attendees;
create policy "fan_event_attendees authenticated link access"
  on public.fan_event_attendees
  for select
  to authenticated
  using (true);
