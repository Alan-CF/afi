import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import {
  fetchMyRooms,
  fetchMyFriends,
  fetchMyRoomInvites,
  acceptRoomInvite,
  declineRoomInvite,
  type FriendOption,
  type RoomInvite,
} from '../../hooks/useRooms';
import RoomCard, { type Room } from '../../components/ui/RoomCard';
import {
  jumpToMockGameLastQuarter,
  resetMockGame,
} from '../../hooks/useMockRoomGameFeed';
import {
  fetchMyFriendIds,
  searchProfilesByUsername,
  sendFriendInvite,
  type SearchResultProfile,
} from '../../lib/friends';
import { supabase } from '../../lib/supabaseClient';
import { usePresence } from '../../hooks/usePresence';
import AvatarFrame from '../../components/ui/AvatarFrame';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  PlusIcon,
  SignalIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

type RoomsLocationState = {
  removedRoomId?: number;
};

const FRIEND_AVATAR_SIZE = 40;
const FRIEND_AVATAR_FRAME_SCALE = 1.3;

function RoomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RoomsLocationState | null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [mainTab, setMainTab] = useState<'rooms' | 'friends'>('rooms');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'live' | 'offline' | 'friends'
  >('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(
    null
  );
  const onlineIds = usePresence();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setMyId(user.id);
    });
  }, []);

  useEffect(() => {
    fetchMyFriends()
      .then(setFriends)
      .catch(console.error)
      .finally(() => setFriendsLoading(false));
  }, []);

  // ── Inline friend search ────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        setResults(await searchProfilesByUsername(query));
        setHasSearched(true);
      } catch (err) {
        console.error('Friend search error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSendInvite(profileId: string) {
    try {
      setSendingId(profileId);
      await sendFriendInvite(profileId);
      setResults((prev) =>
        prev.map((r) =>
          r.id === profileId ? { ...r, friendshipStatus: 'pending_sent' } : r
        )
      );
    } catch (err) {
      console.error('Send invite error:', err);
    } finally {
      setSendingId(null);
    }
  }

  useEffect(() => {
    if (activeFilter !== 'friends') return;
    fetchMyFriendIds().then(setFriendIds).catch(console.error);
  }, [activeFilter]);

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMyRooms();
        setRooms(data);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError(err instanceof Error ? err.message : 'Could not load rooms.');
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, [location.key]);

  useEffect(() => {
    fetchMyRoomInvites().then(setInvites).catch(console.error);
  }, [location.key]);

  useEffect(() => {
    function refreshInvitesAndRooms() {
      fetchMyRoomInvites().then(setInvites).catch(console.error);
      fetchMyRooms().then(setRooms).catch(console.error);
    }
    window.addEventListener('room-invite-changed', refreshInvitesAndRooms);
    return () =>
      window.removeEventListener('room-invite-changed', refreshInvitesAndRooms);
  }, []);

  useEffect(() => {
    if (!state?.removedRoomId) return;

    setRooms((current) =>
      current.filter((room) => room.id !== state.removedRoomId)
    );
  }, [state?.removedRoomId]);

  async function handleAcceptInvite(roomId: number) {
    try {
      setRespondingInviteId(roomId);
      await acceptRoomInvite(roomId);
      setInvites((current) => current.filter((i) => i.roomId !== roomId));
      const data = await fetchMyRooms();
      setRooms(data);
    } catch (err) {
      console.error('Accept room invite error:', err);
    } finally {
      setRespondingInviteId(null);
    }
  }

  async function handleDeclineInvite(roomId: number) {
    try {
      setRespondingInviteId(roomId);
      await declineRoomInvite(roomId);
      setInvites((current) => current.filter((i) => i.roomId !== roomId));
    } catch (err) {
      console.error('Decline room invite error:', err);
    } finally {
      setRespondingInviteId(null);
    }
  }

  const orderedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return a.title.localeCompare(b.title);
    });
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (activeFilter === 'all') return orderedRooms;
    if (activeFilter === 'friends') {
      const friendSet = new Set(friendIds);
      return orderedRooms.filter((room) =>
        room.memberProfileIds
          .filter((id) => id !== myId)
          .every((id) => friendSet.has(id))
      );
    }
    return orderedRooms.filter((room) => room.status === activeFilter);
  }, [orderedRooms, activeFilter, friendIds, myId]);

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aOnline = onlineIds.has(a.id);
      const bOnline = onlineIds.has(b.id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [friends, onlineIds]);

  const onlineFriendCount = useMemo(
    () => friends.filter((f) => onlineIds.has(f.id)).length,
    [friends, onlineIds]
  );

  const liveCount = rooms.filter((room) => room.status === 'live').length;
  const offlineCount = rooms.filter((room) => room.status === 'offline').length;

  function handleCreateRoom() {
    navigate('/rooms/create');
  }

  function handleRoomAction(room: Room) {
    if (room.status === 'live') {
      navigate(`/rooms/${room.id}`, { state: { from: location.pathname } });
      return;
    }

    navigate(`/rooms/${room.id}/summary`, {
      state: { from: location.pathname },
    });
  }

  function handleResetGame() {
    resetMockGame();
  }

  function handleJumpToLastQuarter() {
    jumpToMockGameLastQuarter();
  }

  function isRoomUnread(room: Room): boolean {
    if (!room.lastMessageAt || room.lastMessageFromMe) return false;
    if (typeof window === 'undefined') return false;
    const lastRead = window.localStorage.getItem(`room-last-read-${room.id}`);
    if (!lastRead) return true;
    return new Date(room.lastMessageAt).getTime() > Number(lastRead);
  }

  const roomsPanel = (
    <div className="flex flex-col gap-4">
      {/* Group invites */}
      {invites.length > 0 && (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-1.5 font-lato text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            <UserGroupIcon className="h-4 w-4" />
            Group Invites
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[0.62rem] font-bold text-white">
              {invites.length}
            </span>
          </p>
          <div className="space-y-2">
            {invites.map((invite) => {
              const responding = respondingInviteId === invite.roomId;
              return (
                <div
                  key={invite.roomId}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: invite.accent }}
                    >
                      <UserGroupIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-lato text-sm font-bold text-slate-800">
                        {invite.title}
                      </p>
                      <p className="truncate font-lato text-xs text-slate-500">
                        Invited by @{invite.invitedBy}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Decline"
                        onClick={() => handleDeclineInvite(invite.roomId)}
                        disabled={responding}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-60"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Accept"
                        onClick={() => handleAcceptInvite(invite.roomId)}
                        disabled={responding}
                        className="flex h-8 items-center gap-1 rounded-lg bg-secondary px-3 font-lato text-xs font-bold text-white transition hover:bg-[#16327a] disabled:opacity-60"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Join
                      </button>
                    </div>
                  </div>

                  {invite.nonFriendCount > 0 && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5">
                      <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                      <p className="font-lato text-[11px] font-semibold leading-snug text-secondary">
                        This group has {invite.nonFriendCount}{' '}
                        {invite.nonFriendCount === 1 ? 'person' : 'people'} who{' '}
                        {invite.nonFriendCount === 1 ? 'is' : 'are'} not your
                        friend.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: 'all', label: 'All', count: rooms.length },
            { key: 'live', label: 'Live', count: liveCount },
            { key: 'offline', label: 'Offline', count: offlineCount },
            { key: 'friends', label: 'Friends', count: null },
          ] as const
        ).map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-lato text-xs font-bold transition sm:text-sm ${
                active
                  ? filter.key === 'live'
                    ? 'bg-primary text-secondary'
                    : 'bg-secondary text-white'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-secondary'
              }`}
            >
              {filter.key === 'live' && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? 'bg-secondary' : 'bg-primary'
                  }`}
                />
              )}
              {filter.label}
              {filter.count !== null && (
                <span
                  className={`font-bold ${active ? 'text-white/80' : 'text-slate-400'}`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rooms list */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[76px] rounded-2xl border border-slate-100 bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center font-lato text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredRooms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <p className="font-lato text-base font-bold text-slate-700">
            No rooms here yet
          </p>
          <p className="mx-auto mt-1 max-w-xs font-lato text-sm text-slate-500">
            Start a watch party and bring your friends in for game day.
          </p>
          <Button
            variant="secondary"
            onClick={handleCreateRoom}
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 font-lato text-sm font-bold"
          >
            <PlusIcon className="h-4 w-4" />
            Create Room
          </Button>
        </div>
      )}

      {!loading && !error && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredRooms.map((room, i) => (
            <div
              key={room.id}
              className={`fade-in-up ${i < 6 ? `stagger-${i + 1}` : ''}`}
            >
              <RoomCard
                room={room}
                onActionClick={handleRoomAction}
                hasUnread={isRoomUnread(room)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Mock game controls */}
      <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-400">
          Mock Game
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleResetGame}
            className="rounded-lg px-3 py-1.5 font-lato text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            onClick={handleJumpToLastQuarter}
            className="rounded-lg bg-primary px-3 py-1.5 font-lato text-xs font-bold text-secondary transition hover:bg-primary-dark"
          >
            Last Quarter
          </button>
        </div>
      </div>
    </div>
  );

  const friendsPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-lato text-lg font-bold text-slate-800">Friends</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-lato text-xs font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {onlineFriendCount} online
        </span>
      </div>

      {/* Inline search */}
      <div className="relative mt-4">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find people by username…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 font-lato text-sm text-slate-700 placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:outline-none"
        />
        {searching && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-lato text-xs text-slate-400">
            Searching…
          </span>
        )}
      </div>

      {/* Search results */}
      {query.trim() ? (
        <div className="mt-4">
          {hasSearched && !searching && results.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center font-lato text-sm text-slate-500">
              No profiles found.
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <AvatarFrame
                      frameId={profile.selected_frame_id}
                      size={FRIEND_AVATAR_SIZE}
                      scale={FRIEND_AVATAR_FRAME_SCALE}
                      className="shrink-0"
                    >
                      {profile.avatar_url ? (
                        <div className="h-10 w-10 overflow-hidden rounded-full">
                          <img
                            src={profile.avatar_url}
                            alt={profile.username}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-lato text-base font-bold text-secondary">
                          {profile.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </AvatarFrame>
                    <div className="min-w-0">
                      <p className="truncate font-lato text-sm font-bold text-slate-800">
                        @{profile.username}
                      </p>
                      {profile.name && (
                        <p className="truncate font-lato text-xs text-slate-400">
                          {profile.name}
                        </p>
                      )}
                    </div>
                  </button>

                  {profile.friendshipStatus === 'accepted' ? (
                    <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-1 font-lato text-xs font-bold text-secondary">
                      Friends
                    </span>
                  ) : profile.friendshipStatus === 'pending_sent' ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-lato text-xs font-bold text-emerald-600">
                      Sent
                    </span>
                  ) : profile.friendshipStatus === 'pending_received' ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 font-lato text-xs font-bold text-amber-600">
                      Invited you
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendInvite(profile.id)}
                      disabled={sendingId === profile.id}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 font-lato text-xs font-bold text-white transition hover:bg-[#16327a] disabled:opacity-60"
                    >
                      <UserPlusIcon className="h-3 w-3" />
                      {sendingId === profile.id ? 'Sending…' : 'Add'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : friendsLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : sortedFriends.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
          <p className="font-lato text-sm font-bold text-slate-700">
            No friends yet
          </p>
          <p className="mt-1 font-lato text-xs text-slate-500">
            Search a username above to add people.
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-320px)]">
          {sortedFriends.map((friend) => {
            const online = onlineIds.has(friend.id);
            return (
              <button
                key={friend.id}
                type="button"
                onClick={() => navigate(`/profile/${friend.id}`)}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50"
              >
                <div className="relative flex shrink-0">
                  <AvatarFrame
                    frameId={friend.selected_frame_id}
                    size={FRIEND_AVATAR_SIZE}
                    scale={FRIEND_AVATAR_FRAME_SCALE}
                    className="shrink-0"
                  >
                    {friend.avatar_url ? (
                      <div className="h-10 w-10 overflow-hidden rounded-full">
                        <img
                          src={friend.avatar_url}
                          alt={friend.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full font-lato text-base font-bold text-[#172b5b]"
                        style={{ backgroundColor: friend.accent }}
                      >
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </AvatarFrame>
                  <span
                    className={`absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-white ${
                      online ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-lato text-sm font-bold text-slate-800">
                    @{friend.name}
                  </p>
                  <p
                    className={`font-lato text-xs font-semibold ${
                      online ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 overflow-hidden rounded-2xl bg-secondary px-5 py-5 shadow-[0_18px_40px_rgba(15,38,87,0.28)] sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-lato text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">
                <SignalIcon className="h-3.5 w-3.5" />
                Game Day Hub
              </p>
              <h1 className="mt-1.5 font-anton text-3xl uppercase leading-none tracking-tight text-white sm:text-4xl">
                Fan Rooms
              </h1>
              <div className="mt-2 flex items-center gap-2 font-lato text-sm text-white/80">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-bold text-white">{liveCount}</span> live
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1">
                  {rooms.length} rooms
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleCreateRoom}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border-none bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark"
            >
              <PlusIcon className="h-5 w-5" />
              Create Room
            </Button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 shadow-[0_8px_20px_rgba(15,23,42,0.06)] lg:hidden">
          <button
            onClick={() => setMainTab('rooms')}
            className={`flex-1 rounded-lg px-4 py-2 font-lato text-sm font-bold transition ${
              mainTab === 'rooms'
                ? 'bg-secondary text-white'
                : 'text-slate-500'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => setMainTab('friends')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-lato text-sm font-bold transition ${
              mainTab === 'friends'
                ? 'bg-secondary text-white'
                : 'text-slate-500'
            }`}
          >
            Friends
            {onlineFriendCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[0.62rem] font-bold text-white">
                {onlineFriendCount}
              </span>
            )}
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className={`${mainTab === 'rooms' ? 'block' : 'hidden'} lg:block`}>
            {roomsPanel}
          </section>
          <aside className={`${mainTab === 'friends' ? 'block' : 'hidden'} lg:block`}>
            {friendsPanel}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default RoomsPage;
