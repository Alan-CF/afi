import {
  ArrowLeftIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AvatarFrame from '../../components/ui/AvatarFrame';
import {
  createRoomWithMembers,
  fetchMyFriends,
  type FriendOption,
} from '../../hooks/useRooms';

const INVITE_AVATAR_SIZE = 36;
const INVITE_AVATAR_FRAME_SCALE = 1.3;

function CreateRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendQuery, setFriendQuery] = useState('');

  const selectedCount = selectedFriendIds.length;
  const canCreateRoom = roomName.trim().length > 0 && selectedCount > 0;

  const selectedSet = useMemo(
    () => new Set(selectedFriendIds),
    [selectedFriendIds]
  );

  const selectedFriends = useMemo(
    () => friends.filter((friend) => selectedSet.has(friend.id)),
    [friends, selectedSet]
  );

  const visibleFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) => friend.name.toLowerCase().includes(q));
  }, [friends, friendQuery]);

  useEffect(() => {
    async function loadFriends() {
      try {
        setLoadingFriends(true);
        setError(null);
        const data = await fetchMyFriends();
        setFriends(data);
      } catch (err) {
        console.error('Error loading friends:', err);
        setError(
          err instanceof Error ? err.message : 'Could not load friends.'
        );
      } finally {
        setLoadingFriends(false);
      }
    }

    loadFriends();
  }, []);

  function toggleFriend(friendId: string) {
    setSelectedFriendIds((current) =>
      current.includes(friendId)
        ? current.filter((id) => id !== friendId)
        : [...current, friendId]
    );
  }

  async function handleCreateRoom() {
    if (!canCreateRoom) return;
    try {
      setCreatingRoom(true);
      setError(null);
      const roomId = await createRoomWithMembers(roomName, selectedFriendIds);
      navigate(`/rooms/${roomId}`, { state: { from: '/rooms' } });
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Could not create room.');
    } finally {
      setCreatingRoom(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-2xl flex-col px-4 py-5 sm:px-6">
        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,38,87,0.12)]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-secondary px-5 py-4 text-white sm:px-6">
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 transition-colors hover:bg-white/20"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="font-lato text-[0.66rem] font-bold uppercase tracking-[0.24em] text-primary">
                Room Setup
              </p>
              <h1 className="font-anton text-2xl uppercase leading-none tracking-tight sm:text-3xl">
                Create New Room
              </h1>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 p-5 sm:p-6">
            {/* Room name */}
            <div>
              <label className="mb-2 block font-lato text-sm font-bold text-slate-700">
                Room Name
              </label>
              <input
                type="text"
                placeholder="e.g. Warriors Game Night"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-lato text-sm text-slate-800 placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:outline-none sm:text-base"
              />
            </div>

            {/* Selected friends chips */}
            {selectedFriends.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className="flex items-center gap-1.5 rounded-full bg-secondary/10 py-1 pl-1.5 pr-2.5 font-lato text-xs font-bold text-secondary transition hover:bg-secondary/15"
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-secondary"
                        style={{ backgroundColor: friend.accent }}
                      >
                        {friend.name[0]}
                      </span>
                    )}
                    <span className="max-w-[8rem] truncate">{friend.name}</span>
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Invite friends */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="font-lato text-sm font-bold text-slate-700">
                  Invite Friends
                </label>
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 font-lato text-xs font-bold text-secondary">
                  {selectedCount} selected
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={friendQuery}
                  onChange={(event) => setFriendQuery(event.target.value)}
                  placeholder="Search friends…"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 font-lato text-sm text-slate-800 placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-[44vh] overflow-y-auto">
                  {loadingFriends && (
                    <div className="px-4 py-6 text-center font-lato text-sm text-slate-500">
                      Loading friends...
                    </div>
                  )}

                  {!loadingFriends && friends.length === 0 && (
                    <div className="px-4 py-6 text-center font-lato text-sm text-slate-500">
                      No accepted friends found.
                    </div>
                  )}

                  {!loadingFriends &&
                    friends.length > 0 &&
                    visibleFriends.length === 0 && (
                      <div className="px-4 py-6 text-center font-lato text-sm text-slate-500">
                        No friends match “{friendQuery}”.
                      </div>
                    )}

                  {visibleFriends.map((friend, index) => {
                    const isSelected = selectedSet.has(friend.id);

                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriend(friend.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                          index !== visibleFriends.length - 1
                            ? 'border-b border-slate-100'
                            : ''
                        } ${isSelected ? 'bg-secondary/5' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarFrame
                            frameId={friend.selected_frame_id}
                            size={INVITE_AVATAR_SIZE}
                            scale={INVITE_AVATAR_FRAME_SCALE}
                            className="shrink-0"
                          >
                            {friend.avatar_url ? (
                              <div className="h-9 w-9 overflow-hidden rounded-full">
                                <img
                                  src={friend.avatar_url}
                                  alt={friend.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-lato text-sm font-bold text-secondary"
                                style={{ backgroundColor: friend.accent }}
                              >
                                {friend.name[0]}
                              </div>
                            )}
                          </AvatarFrame>
                          <span className="truncate font-lato text-sm font-bold text-slate-700">
                            {friend.name}
                          </span>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                            isSelected
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-lato text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={!canCreateRoom || loadingFriends || creatingRoom}
              className="w-full rounded-xl border-none bg-primary py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 sm:text-base"
            >
              {creatingRoom
                ? 'Creating Room...'
                : `Create Room${selectedCount > 0 ? ` · ${selectedCount} friend${selectedCount === 1 ? '' : 's'}` : ''}`}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CreateRoom;
