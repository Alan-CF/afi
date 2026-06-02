import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { fetchMyRooms, fetchMyFriends, type FriendOption } from '../../hooks/useRooms';
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
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/solid';

type RoomsLocationState = {
  removedRoomId?: number;
};

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
    if (!state?.removedRoomId) return;

    setRooms((current) =>
      current.filter((room) => room.id !== state.removedRoomId)
    );
  }, [state?.removedRoomId]);

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="mx-auto w-full max-w-[1280px] px-6 pb-10 pt-8 lg:px-10">
        <div className="mb-6">
          <p className="font-lato text-[0.72rem] uppercase tracking-[0.28em] text-primary-3">
            Fan Community
          </p>
          <h1 className="font-lato text-4xl font-black tracking-tight text-secondary lg:text-5xl">
            Private Fan Rooms
          </h1>
        </div>

        <div className="mb-8 inline-flex gap-1 rounded-full bg-white p-1 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <button
            onClick={() => setMainTab('rooms')}
            className={`rounded-full px-6 py-2.5 font-lato text-sm font-bold transition ${
              mainTab === 'rooms'
                ? 'bg-secondary text-white'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => setMainTab('friends')}
            className={`rounded-full px-6 py-2.5 font-lato text-sm font-bold transition ${
              mainTab === 'friends'
                ? 'bg-secondary text-white'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Friends
            {onlineFriendCount > 0 && (
              <span className="ml-2 rounded-full bg-[#34d399] px-2 py-0.5 text-[0.68rem] text-[#04361f]">
                {onlineFriendCount}
              </span>
            )}
          </button>
        </div>

        {mainTab === 'rooms' && (
        <>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] bg-secondary p-4 shadow-[0_20px_45px_rgba(29,66,138,0.18)]">
            <div className="rounded-[1.55rem] border border-white/10 bg-white/10 p-4 text-white sm:p-5">
              <div className="mb-4">
                <div>
                  <p className="font-lato text-[0.68rem] uppercase tracking-[0.24em] text-white/70">
                    Create Room
                  </p>
                  <h2 className="mt-2 font-lato text-[2rem] font-black leading-[1.05]">
                    Start a new
                    <br />
                    watch party
                  </h2>
                </div>
              </div>

              <p className="font-lato text-sm leading-6 text-white/80">
                Open a new private room for live reactions, predictions, and
                game-day chat.
              </p>

              <Button
                variant="primary"
                onClick={handleCreateRoom}
                className="mt-6 w-full rounded-2xl border-none bg-[#f7c62f] px-4 py-3 font-lato text-sm font-bold text-[#172b5b] hover:brightness-95"
              >
                Create Room
              </Button>
            </div>
          </aside>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-lato text-2xl font-bold text-on-surface">
                  Your Rooms
                </h2>
                <p className="mt-1 font-lato text-sm text-on-surface-variant">
                  {filteredRooms.length} of {rooms.length} conversations visible
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`rounded-full px-4 py-2 font-lato text-sm font-bold transition ${
                    activeFilter === 'all'
                      ? 'bg-secondary text-white'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setActiveFilter('live')}
                  className={`rounded-full px-4 py-2 font-lato text-sm font-bold transition ${
                    activeFilter === 'live'
                      ? 'bg-[#ffe7ea] text-[#ff4d57]'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Live ({liveCount})
                </button>

                <button
                  onClick={() => setActiveFilter('offline')}
                  className={`rounded-full px-4 py-2 font-lato text-sm font-bold transition ${
                    activeFilter === 'offline'
                      ? 'bg-[#e9edf5] text-[#667085]'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Offline ({offlineCount})
                </button>

                <button
                  onClick={() => setActiveFilter('friends')}
                  className={`rounded-full px-4 py-2 font-lato text-sm font-bold transition ${
                    activeFilter === 'friends'
                      ? 'bg-[#edf3ff] text-secondary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Only friends
                </button>
              </div>
            </div>

            {loading && (
              <div className="mt-8 rounded-2xl bg-surface-container px-4 py-6 text-center font-lato text-on-surface-variant">
                Loading rooms...
              </div>
            )}

            {error && (
              <div className="mt-8 rounded-2xl bg-[#fff1f2] px-4 py-6 text-center font-lato text-[#be123c]">
                {error}
              </div>
            )}

            {!loading && !error && filteredRooms.length === 0 && (
              <div className="mt-8 rounded-2xl bg-surface-container px-4 py-8 text-center">
                <p className="font-lato text-base font-semibold text-on-surface">
                  No rooms yet
                </p>
                <p className="mt-2 font-lato text-sm text-on-surface-variant">
                  Create your first room to start chatting with friends.
                </p>
              </div>
            )}

            {!loading && !error && filteredRooms.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onActionClick={handleRoomAction}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-lato text-[0.72rem] uppercase tracking-[0.24em] text-primary-3">
                Mock Game Controls
              </p>
              <h2 className="mt-2 font-lato text-xl font-bold text-secondary">
                Test the live game feed
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={handleResetGame}
                className="rounded-2xl px-5 py-3 font-lato text-sm font-bold"
              >
                Reset Game
              </Button>

              <Button
                variant="primary"
                onClick={handleJumpToLastQuarter}
                className="rounded-2xl px-5 py-3 font-lato text-sm font-bold"
              >
                Last Quarter
              </Button>
            </div>
          </div>
        </section>
        </>
        )}

        {mainTab === 'friends' && (
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
            <div>
              <h2 className="font-lato text-2xl font-bold text-on-surface">
                Friends
              </h2>
              <p className="mt-1 font-lato text-sm text-on-surface-variant">
                {onlineFriendCount} of {friends.length} online
              </p>
            </div>

            {/* Inline search */}
            <div className="relative mt-5">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username to add friends…"
                className="w-full rounded-full border-2 border-[#c9d6ea] bg-white py-3 pl-11 pr-4 font-lato text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:border-secondary focus:outline-none"
              />
              {searching && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-lato text-xs text-[#94a3b8]">
                  Searching…
                </span>
              )}
            </div>

            {/* Search results */}
            {query.trim() && (
              <div className="mt-5">
                {hasSearched && !searching && results.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container px-4 py-6 text-center font-lato text-sm text-on-surface-variant">
                    No profiles found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {results.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#e4ebf6] bg-[#fbfdff] px-4 py-3"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <AvatarFrame
                            frameId={profile.selected_frame_id}
                            size={44}
                            scale={1.0}
                          >
                            {profile.avatar_url ? (
                              <div className="h-11 w-11 overflow-hidden rounded-full">
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.username}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbe4f5] font-lato text-base font-bold text-secondary">
                                {profile.username[0]?.toUpperCase()}
                              </div>
                            )}
                          </AvatarFrame>
                          <div className="min-w-0">
                            <p className="truncate font-lato text-sm font-bold text-on-surface">
                              @{profile.username}
                            </p>
                            {profile.name && (
                              <p className="truncate font-lato text-xs text-on-surface-variant">
                                {profile.name}
                              </p>
                            )}
                          </div>
                        </button>

                        {profile.friendshipStatus === 'accepted' ? (
                          <span className="shrink-0 rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary">
                            Friends
                          </span>
                        ) : profile.friendshipStatus === 'pending_sent' ? (
                          <span className="shrink-0 rounded-full bg-[#f0fdf4] px-3 py-1 font-lato text-xs font-bold text-[#16a34a]">
                            Sent
                          </span>
                        ) : profile.friendshipStatus === 'pending_received' ? (
                          <span className="shrink-0 rounded-full bg-[#fef9c3] px-3 py-1 font-lato text-xs font-bold text-[#a16207]">
                            Invited you
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendInvite(profile.id)}
                            disabled={sendingId === profile.id}
                            className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-lato text-xs font-bold text-white transition hover:bg-[#16327a] disabled:opacity-60"
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
            )}

            {/* Friends list (hidden while searching) */}
            {!query.trim() &&
            (friendsLoading ? (
              <div className="mt-8 rounded-2xl bg-surface-container px-4 py-6 text-center font-lato text-on-surface-variant">
                Loading friends...
              </div>
            ) : sortedFriends.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-surface-container px-4 py-8 text-center">
                <p className="font-lato text-base font-semibold text-on-surface">
                  No friends yet
                </p>
                <p className="mt-2 font-lato text-sm text-on-surface-variant">
                  Tap Add Friends to find people.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sortedFriends.map((friend) => {
                  const online = onlineIds.has(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => navigate(`/profile/${friend.id}`)}
                      className="flex items-center gap-3 rounded-2xl border border-[#e4ebf6] bg-[#fbfdff] px-4 py-3 text-left transition hover:border-secondary/40 hover:bg-[#f3f7ff]"
                    >
                      <div className="relative shrink-0">
                        <AvatarFrame
                          frameId={friend.selected_frame_id}
                          size={44}
                          scale={1.0}
                        >
                          {friend.avatar_url ? (
                            <div className="h-11 w-11 overflow-hidden rounded-full">
                              <img
                                src={friend.avatar_url}
                                alt={friend.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-full font-lato text-base font-bold text-[#172b5b]"
                              style={{ backgroundColor: friend.accent }}
                            >
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </AvatarFrame>
                        <span
                          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                            online ? 'bg-[#34d399]' : 'bg-[#cbd5e1]'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-lato text-sm font-bold text-on-surface">
                          @{friend.name}
                        </p>
                        <p
                          className={`font-lato text-[0.78rem] font-semibold ${
                            online ? 'text-[#16a34a]' : 'text-on-surface-variant'
                          }`}
                        >
                          {online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default RoomsPage;
