alter table public.fan_events
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.fan_events
  add column if not exists highlights text[] not null default '{}'::text[];

alter table public.fan_events
  add column if not exists address text;

alter table public.fan_events
  add column if not exists state text;

alter table public.fan_events
  add column if not exists country_code text;

alter table public.fan_events
  add column if not exists lat double precision;

alter table public.fan_events
  add column if not exists lng double precision;

alter table public.fan_events
  add column if not exists host_bio text;
