-- =========================================================
-- ROOM MATCH VISIBILITY
-- Whether the live match panel (score strip, predictions and
-- prediction result messages) is shown inside a room. This is a
-- room-wide setting controlled only by the room owner: the existing
-- owner-only "rooms_update" policy already restricts who can change
-- it, so no extra policy is needed.
-- =========================================================

alter table public.rooms
  add column if not exists match_hidden boolean not null default false;

comment on column public.rooms.match_hidden is
  'When true, the live match panel and prediction messages are hidden for everyone in the room. Only the owner can toggle it.';
