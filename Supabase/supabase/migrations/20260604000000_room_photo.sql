-- =========================================================
-- Room shared photo
--   * adds rooms.image_url
--   * lets any accepted member update the room (per product decision)
--   * room-avatars storage bucket + policies (members of the room)
-- =========================================================

-- 1) Column
alter table public.rooms
  add column if not exists image_url text;

-- 2) Allow accepted members (not just the owner) to update the room.
--    The existing rooms_update_owner_only policy stays in place; policies are
--    permissive, so either one granting access is enough.
drop policy if exists "rooms_update_members" on public.rooms;
create policy "rooms_update_members"
on public.rooms
for update
to authenticated
using (
  exists (
    select 1
    from public.room_members rm
    where rm.room_id = rooms.id
      and rm.profile_id = auth.uid()
      and rm.status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from public.room_members rm
    where rm.room_id = rooms.id
      and rm.profile_id = auth.uid()
      and rm.status = 'accepted'
  )
);

-- 3) Storage bucket for room photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-avatars',
  'room-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Path convention: "<room_id>/<file>" -> foldername[1] is the room id.
drop policy if exists "Anyone can view room avatars" on storage.objects;
create policy "Anyone can view room avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'room-avatars'::text);

drop policy if exists "Members can upload room avatars" on storage.objects;
create policy "Members can upload room avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'room-avatars'::text
    and exists (
      select 1
      from public.room_members rm
      where rm.room_id = ((storage.foldername(name))[1])::bigint
        and rm.profile_id = auth.uid()
        and rm.status = 'accepted'
    )
  );

drop policy if exists "Members can update room avatars" on storage.objects;
create policy "Members can update room avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'room-avatars'::text
    and exists (
      select 1
      from public.room_members rm
      where rm.room_id = ((storage.foldername(name))[1])::bigint
        and rm.profile_id = auth.uid()
        and rm.status = 'accepted'
    )
  );

drop policy if exists "Members can delete room avatars" on storage.objects;
create policy "Members can delete room avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'room-avatars'::text
    and exists (
      select 1
      from public.room_members rm
      where rm.room_id = ((storage.foldername(name))[1])::bigint
        and rm.profile_id = auth.uid()
        and rm.status = 'accepted'
    )
  );

comment on column public.rooms.image_url is 'Shared room photo (any accepted member can change it).';
