import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/layout/NavBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
  createRoomWithMembers,
  fetchMyFriends,
  type FriendOption,
} from "../../services/rooms";

function CreateRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedFriendIds.length;
  const canCreateRoom = roomName.trim().length > 0 && selectedCount > 0;

  const selectedSet = useMemo(() => new Set(selectedFriendIds), [selectedFriendIds]);

  useEffect(() => {
    async function loadFriends() {
      try {
        setLoadingFriends(true);
        setError(null);
        const data = await fetchMyFriends();
        setFriends(data);
      } catch (err) {
        console.error("Error loading friends:", err);
        setError(
          err instanceof Error ? err.message : "Could not load friends."
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
      await createRoomWithMembers(roomName, selectedFriendIds);
      navigate("/rooms");
    } catch (err) {
      console.error("Error creating room:", err);
      setError(
        err instanceof Error ? err.message : "Could not create room."
      );
    } finally {
      setCreatingRoom(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <NavBar />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">
        <section className="mx-auto flex w-full max-w-md flex-1 flex-col rounded-[1.75rem] bg-white/92 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:max-w-xl sm:p-5 lg:max-w-3xl lg:p-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/rooms")}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ff] text-secondary transition-colors hover:bg-[#dfe9fb]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.24em] text-secondary/55 sm:text-xs">
                Room Setup
              </p>
              <h1 className="font-barlow-condensed text-[2rem] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1f3668] sm:text-[2.4rem] lg:text-[3rem]">
                Create New Room
              </h1>
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col gap-5">
            <div>
              <label className="mb-2 block font-lato text-sm font-bold text-secondary sm:text-base">
                Room Name
              </label>
              <Input
                placeholder="e.g., Warriors Game Night"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                className="w-full border-2 border-[#c9d6ea] bg-white px-4 py-3 text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:border-primary sm:text-base"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="font-lato text-sm font-bold text-secondary sm:text-base">
                  Invite Friends
                </label>
                <span className="rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary sm:text-sm">
                  {selectedCount} selected
                </span>
              </div>

              <div className="flex-1 overflow-hidden rounded-[1.5rem] border-2 border-[#cfd9ea] bg-[#fdfefe]">
                <div className="max-h-[46vh] overflow-y-auto lg:max-h-[52vh]">
                  {loadingFriends && (
                    <div className="px-4 py-6 text-center font-lato text-sm text-[#6b7a90]">
                      Loading friends...
                    </div>
                  )}

                  {!loadingFriends && friends.length === 0 && (
                    <div className="px-4 py-6 text-center font-lato text-sm text-[#6b7a90]">
                      No accepted friends found.
                    </div>
                  )}

                  {friends.map((friend, index) => {
                    const isSelected = selectedSet.has(friend.id);

                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriend(friend.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors sm:px-5 ${
                          index !== friends.length - 1 ? "border-b border-[#d9e2f0]" : ""
                        } ${isSelected ? "bg-[#f5f9ff]" : "bg-white hover:bg-[#f9fbff]"}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-lato text-sm font-bold text-secondary"
                            style={{ backgroundColor: friend.accent }}
                          >
                            {friend.name[0]}
                          </div>
                          <span className="truncate font-lato text-sm font-bold text-[#304564] sm:text-base">
                            {friend.name}
                          </span>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? "border-primary bg-primary text-secondary"
                              : "border-[#c7d4e8] bg-white text-transparent"
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
          </div>

          {error && (
            <div className="mt-4 rounded-[1rem] bg-[#fff1f2] px-4 py-3 font-lato text-sm text-[#be123c]">
              {error}
            </div>
          )}

          <div className="sticky bottom-0 mt-5 bg-white/92 pt-2">
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={!canCreateRoom || loadingFriends || creatingRoom}
              className="w-full rounded-[1.2rem] border-transparent py-3 text-sm font-bold text-secondary disabled:bg-[#b7c8df] disabled:text-white sm:py-4 sm:text-base"
            >
              {creatingRoom
                ? "Creating Room..."
                : `Create Room (${selectedCount} Friend${selectedCount === 1 ? "" : "s"})`}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CreateRoom;
