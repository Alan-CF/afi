-- =========================================================
-- FAN_EVENTS — warriors meetups and community gatherings
-- =========================================================

create table if not exists public.fan_events (
  id           bigint generated always as identity primary key,
  title        text        not null,
  description  text,
  image_url    text,
  start_at     timestamptz not null,
  end_at       timestamptz,
  venue        text,
  city         text,
  country      text        not null default 'US',
  organizer_profile_id uuid not null references public.profiles(id) on delete cascade,
  capacity     integer,
  is_public    boolean     not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists fan_events_start_at_idx
  on public.fan_events (start_at);
create index if not exists fan_events_organizer_idx
  on public.fan_events (organizer_profile_id);

create table if not exists public.fan_event_attendees (
  id           bigint generated always as identity primary key,
  fan_event_id bigint not null references public.fan_events(id) on delete cascade,
  profile_id   uuid   not null references public.profiles(id) on delete cascade,
  status       text   not null check (status in ('going','interested','declined')) default 'interested',
  created_at   timestamptz not null default now(),
  unique (fan_event_id, profile_id)
);

create index if not exists fan_event_attendees_event_idx
  on public.fan_event_attendees (fan_event_id);
create index if not exists fan_event_attendees_profile_idx
  on public.fan_event_attendees (profile_id);

alter table public.fan_events           enable row level security;
alter table public.fan_event_attendees  enable row level security;

create policy "fan_events public read"
  on public.fan_events for select
  using (is_public = true);

create policy "fan_events organizer insert"
  on public.fan_events for insert
  with check (auth.uid() = organizer_profile_id);

create policy "fan_events organizer update"
  on public.fan_events for update
  using (auth.uid() = organizer_profile_id);

create policy "fan_event_attendees self read"
  on public.fan_event_attendees for select
  using (auth.uid() = profile_id);

create policy "fan_event_attendees self write"
  on public.fan_event_attendees for insert
  with check (auth.uid() = profile_id);

create policy "fan_event_attendees self update"
  on public.fan_event_attendees for update
  using (auth.uid() = profile_id);

create or replace function public.fan_event_going_count(p_event_id bigint)
returns integer
language sql stable as $$
  select count(*)::int
  from public.fan_event_attendees
  where fan_event_id = p_event_id and status = 'going';
$$;

grant execute on function public.fan_event_going_count(bigint) to anon, authenticated;
