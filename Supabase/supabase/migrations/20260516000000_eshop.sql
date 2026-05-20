-- eShop: e-coins + cosmetic profile frames
-- Adds an e_coins balance (mirrors point gains), a frames catalog, an owned_frames
-- inventory, and a selected_frame_id on profiles. Leaderboard remains on fanatic_coins.

-- 1) Profile columns -----------------------------------------------------------
alter table "public"."profiles"
  add column if not exists "e_coins" bigint not null default 0,
  add column if not exists "selected_frame_id" text;

-- Backfill existing users: e_coins = current total points
update "public"."profiles"
  set e_coins = fanatic_coins
  where e_coins = 0 and fanatic_coins > 0;

-- 2) Frames catalog ------------------------------------------------------------
create table if not exists "public"."frames" (
  "id"          text primary key,
  "name"        text not null,
  "image_path"  text not null,
  "price"       bigint not null check (price >= 0),
  "sort_order"  integer not null default 0,
  "is_active"   boolean not null default true,
  "created_at"  timestamptz not null default now()
);

alter table "public"."frames" enable row level security;

drop policy if exists "frames_read_all" on "public"."frames";
create policy "frames_read_all"
  on "public"."frames"
  as permissive
  for select
  to public
  using (is_active = true);

grant select on table "public"."frames" to anon, authenticated, service_role;

-- Seed the 6 bundled frame PNGs (paths point at React/src/frames assets).
insert into "public"."frames" (id, name, image_path, price, sort_order)
values
  ('frame_01', 'Rookie',     'frame_01.png',  500, 1),
  ('frame_02', 'Sharpshooter', 'frame_02.png', 1500, 2),
  ('frame_03', 'All-Star',   'frame_03.png', 3000, 3),
  ('frame_04', 'MVP',        'frame_04.png', 5000, 4),
  ('frame_05', 'Hall of Fame','frame_05.png', 8000, 5),
  ('frame_06', 'Legend',     'frame_06.png', 12000, 6)
on conflict (id) do update
  set name       = excluded.name,
      image_path = excluded.image_path,
      price      = excluded.price,
      sort_order = excluded.sort_order,
      is_active  = true;

-- 3) Owned frames inventory ----------------------------------------------------
create table if not exists "public"."owned_frames" (
  "profile_id"   uuid not null references public.profiles(id) on delete cascade,
  "frame_id"     text not null references public.frames(id) on delete cascade,
  "purchased_at" timestamptz not null default now(),
  primary key (profile_id, frame_id)
);

alter table "public"."owned_frames" enable row level security;

drop policy if exists "owned_frames_select_self" on "public"."owned_frames";
create policy "owned_frames_select_self"
  on "public"."owned_frames"
  as permissive
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

-- Inserts happen only via purchase_frame() (SECURITY DEFINER), no insert policy.
grant select on table "public"."owned_frames" to authenticated, service_role;

create index if not exists owned_frames_profile_id_idx
  on public.owned_frames (profile_id);

-- 4) selected_frame_id FK ------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_selected_frame_id_fkey'
  ) then
    alter table "public"."profiles"
      add constraint "profiles_selected_frame_id_fkey"
      foreign key (selected_frame_id) references public.frames(id) on delete set null;
  end if;
end$$;

-- 5) Sync trigger: any increase of fanatic_coins also credits e_coins ----------
-- Captures every points-earning flow (award_points RPC, assign_fanatic_coins
-- procedure, manual SQL, etc.) without requiring changes to each caller.
create or replace function public.trigger_sync_ecoins()
returns trigger
language plpgsql
as $$
begin
  if new.fanatic_coins > coalesce(old.fanatic_coins, 0) then
    new.e_coins := coalesce(old.e_coins, 0) + (new.fanatic_coins - coalesce(old.fanatic_coins, 0));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_ecoins on public.profiles;
create trigger trg_sync_ecoins
  before update of fanatic_coins on public.profiles
  for each row
  when (new.fanatic_coins is distinct from old.fanatic_coins)
  execute function public.trigger_sync_ecoins();

-- 6) Purchase frame RPC --------------------------------------------------------
create or replace function public.purchase_frame(p_frame_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_price      bigint;
  v_balance    bigint;
begin
  if v_profile_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select price into v_price
  from public.frames
  where id = p_frame_id and is_active = true;

  if v_price is null then
    raise exception 'frame_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.owned_frames
    where profile_id = v_profile_id and frame_id = p_frame_id
  ) then
    raise exception 'already_owned' using errcode = '23505';
  end if;

  -- Atomic conditional debit. If e_coins < price, no row matches -> v_balance stays null.
  update public.profiles
  set e_coins = e_coins - v_price
  where id = v_profile_id and e_coins >= v_price
  returning e_coins into v_balance;

  if v_balance is null then
    raise exception 'insufficient_balance' using errcode = 'P0001';
  end if;

  insert into public.owned_frames (profile_id, frame_id)
  values (v_profile_id, p_frame_id)
  on conflict do nothing;

  return jsonb_build_object(
    'e_coins',   v_balance,
    'frame_id',  p_frame_id
  );
end;
$$;

revoke all on function public.purchase_frame(text) from public;
grant execute on function public.purchase_frame(text) to authenticated;

-- 7) Select frame RPC ----------------------------------------------------------
create or replace function public.select_frame(p_frame_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_frame_id is not null and not exists (
    select 1 from public.owned_frames
    where profile_id = v_profile_id and frame_id = p_frame_id
  ) then
    raise exception 'frame_not_owned' using errcode = 'P0002';
  end if;

  update public.profiles
  set selected_frame_id = p_frame_id
  where id = v_profile_id;
end;
$$;

revoke all on function public.select_frame(text) from public;
grant execute on function public.select_frame(text) to authenticated;
