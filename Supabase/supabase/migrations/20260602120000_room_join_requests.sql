-- =========================================================
-- ROOM JOIN REQUESTS
-- Invited members are added as 'pending' and must accept the
-- request before they actually join the room. Owners join as
-- 'accepted'. Existing rows default to 'accepted' (no behavior
-- change for current data).
-- =========================================================

-- 1. Membership status -------------------------------------------------------
alter table public.room_members
  add column if not exists status text not null default 'accepted'
  check (status in ('pending', 'accepted'));

create index if not exists room_members_status_idx
  on public.room_members (status);

-- 2. Only accepted members count as members ----------------------------------
-- Pending invitees can no longer read messages or be treated as members
-- until they accept. Existing rows are 'accepted', so nothing changes for
-- current rooms.
create or replace function public.is_member_of_room(target_room_id bigint)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
      and rm.status = 'accepted'
  );
$function$
;

-- 3. Let pending invitees read the room they were invited to -----------------
-- (needed to display the join request). Any membership row — pending or
-- accepted — grants read access to the room record itself.
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select"
on public.rooms
as permissive
for select
to authenticated
using (
  owner_profile_id = auth.uid()
  or exists (
    select 1
    from public.room_members rm
    where rm.room_id = rooms.id
      and rm.profile_id = auth.uid()
  )
);

-- 4. Let an invitee accept (update their own membership row) ------------------
drop policy if exists "room_members_update_self" on public.room_members;
create policy "room_members_update_self"
on public.room_members
as permissive
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

comment on column public.room_members.status is
  'pending = invited but not yet joined; accepted = active member';
