-- =========================================================
-- ROOMS PHASE 1
-- Funcionalidades:
-- 1) Lista de rooms
-- 2) Crear room
-- 3) Chat básico
-- =========================================================

-- =========================
-- 1. FRIENDSHIPS
-- =========================
create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_no_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair_idx
on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

create index if not exists friendships_requester_idx
on public.friendships (requester_id);

create index if not exists friendships_addressee_idx
on public.friendships (addressee_id);

-- =========================
-- 2. ROOMS
-- =========================
create table if not exists public.rooms (
  id bigint generated always as identity primary key,
  title text not null,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'live' check (status in ('live', 'offline')),
  accent text not null default '#1D4ED8',
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists rooms_owner_profile_id_idx
on public.rooms (owner_profile_id);

create index if not exists rooms_status_idx
on public.rooms (status);

-- =========================
-- 3. ROOM MEMBERS
-- =========================
create table if not exists public.room_members (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (room_id, profile_id)
);

create index if not exists room_members_room_id_idx
on public.room_members (room_id);

create index if not exists room_members_profile_id_idx
on public.room_members (profile_id);

-- =========================
-- 4. ROOM MESSAGES
-- =========================
create table if not exists public.room_messages (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.rooms(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_id_created_at_idx
on public.room_messages (room_id, created_at desc);

create index if not exists room_messages_sender_profile_id_idx
on public.room_messages (sender_profile_id);

-- =========================================================
-- RLS
-- =========================================================

alter table public.friendships enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;

-- =========================
-- FRIENDSHIPS POLICIES
-- =========================

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
on public.friendships
for select
to authenticated
using (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
);

drop policy if exists "friendships_insert_own_request" on public.friendships;
create policy "friendships_insert_own_request"
on public.friendships
for insert
to authenticated
with check (
  requester_id = auth.uid()
);

drop policy if exists "friendships_update_participants" on public.friendships;
create policy "friendships_update_participants"
on public.friendships
for update
to authenticated
using (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
)
with check (
  requester_id = auth.uid()
  or addressee_id = auth.uid()
);

-- =========================
-- ROOMS POLICIES
-- =========================

drop policy if exists "rooms_select_if_member" on public.rooms;
create policy "rooms_select_if_member"
on public.rooms
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members rm
    where rm.room_id = rooms.id
      and rm.profile_id = auth.uid()
  )
);

drop policy if exists "rooms_insert_owner_only" on public.rooms;
create policy "rooms_insert_owner_only"
on public.rooms
for insert
to authenticated
with check (
  owner_profile_id = auth.uid()
);

drop policy if exists "rooms_update_owner_only" on public.rooms;
create policy "rooms_update_owner_only"
on public.rooms
for update
to authenticated
using (
  owner_profile_id = auth.uid()
)
with check (
  owner_profile_id = auth.uid()
);

drop policy if exists "rooms_delete_owner_only" on public.rooms;
create policy "rooms_delete_owner_only"
on public.rooms
for delete
to authenticated
using (
  owner_profile_id = auth.uid()
);

-- =========================
-- ROOM MEMBERS POLICIES
-- =========================

drop policy if exists "room_members_select_if_same_room" on public.room_members;
create policy "room_members_select_if_same_room"
on public.room_members
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members rm2
    where rm2.room_id = room_members.room_id
      and rm2.profile_id = auth.uid()
  )
);

drop policy if exists "room_members_insert_owner_only" on public.room_members;
create policy "room_members_insert_owner_only"
on public.room_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_members.room_id
      and r.owner_profile_id = auth.uid()
  )
);

drop policy if exists "room_members_delete_owner_only" on public.room_members;
create policy "room_members_delete_owner_only"
on public.room_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_members.room_id
      and r.owner_profile_id = auth.uid()
  )
);

-- =========================
-- ROOM MESSAGES POLICIES
-- =========================

drop policy if exists "room_messages_select_if_member" on public.room_messages;
create policy "room_messages_select_if_member"
on public.room_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members rm
    where rm.room_id = room_messages.room_id
      and rm.profile_id = auth.uid()
  )
);

drop policy if exists "room_messages_insert_if_member_and_sender_is_self" on public.room_messages;
create policy "room_messages_insert_if_member_and_sender_is_self"
on public.room_messages
for insert
to authenticated
with check (
  sender_profile_id = auth.uid()
  and exists (
    select 1
    from public.room_members rm
    where rm.room_id = room_messages.room_id
      and rm.profile_id = auth.uid()
  )
);

-- =========================================================
-- OPTIONAL: helpful comments
-- =========================================================
comment on table public.friendships is 'Friend relationships between profiles';
comment on table public.rooms is 'Private fan rooms';
comment on table public.room_members is 'Membership of profiles inside rooms';
comment on table public.room_messages is 'Messages sent inside a room';