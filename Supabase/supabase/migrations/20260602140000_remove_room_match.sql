-- =========================================================
-- REMOVE ROOM MATCH
-- Removing a match is owner-only and clears stored prediction rows so old
-- prediction results cannot reappear for room members after the match is
-- hidden.
-- =========================================================

-- Treat the owner_profile_id and the accepted room_members owner role as owner
-- signals. Some existing rooms can rely on either source.
create or replace function public.is_owner_of_room(target_room_id bigint)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
      and rm.role = 'owner'
      and rm.status = 'accepted'
  );
$function$;

-- The remote schema dropped the original owner update policy. Recreate an
-- owner-only update policy so room settings such as match_hidden can persist.
drop policy if exists "rooms_update" on public.rooms;
drop policy if exists "rooms_update_owner_only" on public.rooms;
create policy "rooms_update"
on public.rooms
as permissive
for update
to authenticated
using (public.is_owner_of_room(id))
with check (public.is_owner_of_room(id));

create or replace function public.remove_room_match(target_room_id bigint)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.is_owner_of_room(target_room_id) then
    raise exception 'not_room_owner' using errcode = '42501';
  end if;

  update public.rooms
  set match_hidden = true
  where id = target_room_id;

  delete from public.room_messages
  where room_id = target_room_id
    and content like '[[prediction]] %';
end;
$function$;

revoke all on function public.remove_room_match(bigint) from public;
grant execute on function public.remove_room_match(bigint) to authenticated;

-- Realtime: emit room setting changes so members can hide the match quickly.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end
$$;
