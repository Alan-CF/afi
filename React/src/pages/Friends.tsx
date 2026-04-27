import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import {
  ArrowLeftIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  acceptFriendInvite,
  declineFriendInvite,
  fetchMyFriends,
  fetchPendingFriendInvites,
  removeFriend,
  searchProfilesByUsername,
  sendFriendInvite,
  type Friend,
  type PendingInvite,
  type SearchResultProfile,
} from "../lib/friends";

// ─── Shared accent palette ───────────────────────────────────────────────────

const ACCENTS = [
  "#8FB3E8", "#B8C9E8", "#9CB6E6", "#C8D6F2",
  "#A4BCE9", "#8CA8DB", "#B5C4E0", "#9FB3D8",
];

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  username,
  avatarUrl,
  index = 0,
  size = "md",
}: {
  username: string;
  avatarUrl: string | null;
  index?: number;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";
  if (avatarUrl) {
    return (
      <div className={`${dim} shrink-0 overflow-hidden rounded-full`}>
        <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-lato font-bold text-secondary`}
      style={{ backgroundColor: ACCENTS[index % ACCENTS.length] }}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}

// ─── Remove confirmation modal ────────────────────────────────────────────────

function RemoveModal({
  friend,
  onConfirm,
  onCancel,
  loading,
}: {
  friend: Friend;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.2)]">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="font-lato text-lg font-bold text-[#1f3668]">
            Remove friend?
          </h3>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-secondary hover:bg-[#dfe9fb]"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="font-lato text-sm leading-relaxed text-[#6b7a90]">
          Remove{" "}
          <span className="font-bold text-secondary">
            @{friend.profile.username}
          </span>{" "}
          from your friends? They won't be notified.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-[1rem] border-2 border-[#cfd9ea] py-2.5 font-lato text-sm font-bold text-[#6b7a90] transition-colors hover:border-secondary hover:text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-[1rem] bg-[#be123c] py-2.5 font-lato text-sm font-bold text-white transition-colors hover:bg-[#9f1239] disabled:opacity-60"
          >
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── My Friends tab ───────────────────────────────────────────────────────────

function MyFriendsTab() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Friend | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setFriends(await fetchMyFriends());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load friends.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveConfirm() {
    if (!pendingRemove) return;
    try {
      setRemoveLoading(true);
      await removeFriend(pendingRemove.friendshipId);
      setFriends((prev) =>
        prev.filter((f) => f.friendshipId !== pendingRemove.friendshipId)
      );
      setPendingRemove(null);
    } catch (err) {
      console.error("Remove friend error:", err);
    } finally {
      setRemoveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center font-lato text-sm text-[#6b7a90]">
        Loading friends…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1rem] bg-[#fff1f2] px-4 py-4 font-lato text-sm text-[#be123c]">
        {error}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3ff]">
          <UserPlusIcon className="h-7 w-7 text-secondary" />
        </div>
        <p className="font-lato text-base font-bold text-[#1f3668]">
          No friends yet
        </p>
        <p className="mt-1 font-lato text-sm text-[#6b7a90]">
          Switch to the Add Friends tab to find people.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[1.5rem] border-2 border-[#cfd9ea] bg-[#fdfefe]">
        {friends.map((friend, index) => (
          <div
            key={friend.friendshipId}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              index !== friends.length - 1 ? "border-b border-[#d9e2f0]" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                username={friend.profile.username}
                avatarUrl={friend.profile.avatar_url}
                index={index}
              />
              <div className="min-w-0">
                <p className="truncate font-lato text-sm font-bold text-[#304564]">
                  @{friend.profile.username}
                </p>
                {friend.profile.name && (
                  <p className="truncate font-lato text-xs text-[#6b7a90]">
                    {friend.profile.name}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setPendingRemove(friend)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff1f2] text-[#be123c] transition-colors hover:bg-[#fce7f3]"
              title="Remove friend"
            >
              <UserMinusIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {pendingRemove && (
        <RemoveModal
          friend={pendingRemove}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setPendingRemove(null)}
          loading={removeLoading}
        />
      )}
    </>
  );
}

// ─── Add Friends tab ──────────────────────────────────────────────────────────

function AddFriendsTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function doSearch(q: string) {
    try {
      setSearching(true);
      setSearchError(null);
      setResults(await searchProfilesByUsername(q));
      setHasSearched(true);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Search failed. Try again."
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleSendInvite(profileId: string) {
    try {
      setSendingId(profileId);
      await sendFriendInvite(profileId);
      setResults((prev) =>
        prev.map((r) =>
          r.id === profileId ? { ...r, friendshipStatus: "pending_sent" } : r
        )
      );
    } catch (err) {
      console.error("Send invite error:", err);
    } finally {
      setSendingId(null);
    }
  }

  function StatusBadge({ profile }: { profile: SearchResultProfile }) {
    const status = profile.friendshipStatus;
    if (status === "accepted") {
      return (
        <span className="rounded-full bg-[#edf3ff] px-3 py-1 font-lato text-xs font-bold text-secondary">
          Friends
        </span>
      );
    }
    if (status === "pending_sent") {
      return (
        <span className="rounded-full bg-[#f0fdf4] px-3 py-1 font-lato text-xs font-bold text-[#16a34a]">
          Invite sent
        </span>
      );
    }
    if (status === "pending_received") {
      return (
        <span className="rounded-full bg-[#fef9c3] px-3 py-1 font-lato text-xs font-bold text-[#a16207]">
          Sent you invite
        </span>
      );
    }
    return (
      <button
        onClick={() => handleSendInvite(profile.id)}
        disabled={sendingId === profile.id}
        className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-lato text-xs font-bold text-white transition-colors hover:bg-[#16327a] disabled:opacity-60"
      >
        <UserPlusIcon className="h-3 w-3" />
        {sendingId === profile.id ? "Sending…" : "Send invite"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username…"
          className="w-full rounded-[1rem] border-2 border-[#c9d6ea] bg-white py-3 pl-11 pr-4 font-lato text-sm text-[#24344f] placeholder:text-[#94a3b8] focus:border-secondary focus:outline-none"
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-lato text-xs text-[#94a3b8]">
            Searching…
          </span>
        )}
      </div>

      {/* Error */}
      {searchError && (
        <div className="rounded-[1rem] bg-[#fff1f2] px-4 py-3 font-lato text-sm text-[#be123c]">
          {searchError}
        </div>
      )}

      {/* Idle prompt */}
      {!query.trim() && (
        <div className="py-10 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-2 h-8 w-8 text-[#c9d6ea]" />
          <p className="font-lato text-sm text-[#6b7a90]">
            Search for a username to find friends.
          </p>
        </div>
      )}

      {/* No results */}
      {hasSearched && !searching && results.length === 0 && query.trim() && (
        <div className="rounded-[1rem] bg-[#f8fbff] px-5 py-5 text-center font-lato text-sm leading-relaxed text-[#6b7a90]">
          No profiles found. You can ask your friends to send you an invite by
          searching your username.
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-[1.5rem] border-2 border-[#cfd9ea] bg-[#fdfefe]">
          {results.map((profile, index) => (
            <div
              key={profile.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                index !== results.length - 1 ? "border-b border-[#d9e2f0]" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  index={index}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-lato text-sm font-bold text-[#304564]">
                    @{profile.username}
                  </p>
                  {profile.name && (
                    <p className="truncate font-lato text-xs text-[#6b7a90]">
                      {profile.name}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge profile={profile} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Requests tab ────────────────────────────────────────────────────────────

function RequestsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPendingFriendInvites();
      setInvites(data);
      onCountChange(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  function dismiss(friendshipId: string) {
    setInvites((prev) => {
      const next = prev.filter((i) => i.friendshipId !== friendshipId);
      onCountChange(next.length);
      return next;
    });
  }

  async function handleAccept(invite: PendingInvite) {
    try {
      setActingId(invite.friendshipId);
      await acceptFriendInvite(invite.friendshipId);
      dismiss(invite.friendshipId);
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(invite: PendingInvite) {
    try {
      setActingId(invite.friendshipId);
      await declineFriendInvite(invite.friendshipId);
      dismiss(invite.friendshipId);
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center font-lato text-sm text-[#6b7a90]">
        Loading requests…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1rem] bg-[#fff1f2] px-4 py-4 font-lato text-sm text-[#be123c]">
        {error}
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3ff]">
          <CheckIcon className="h-7 w-7 text-secondary" />
        </div>
        <p className="font-lato text-base font-bold text-[#1f3668]">
          No pending requests
        </p>
        <p className="mt-1 font-lato text-sm text-[#6b7a90]">
          Friend invites you receive will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border-2 border-[#cfd9ea] bg-[#fdfefe]">
      {invites.map((invite, index) => {
        const busy = actingId === invite.friendshipId;
        return (
          <div
            key={invite.friendshipId}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              index !== invites.length - 1 ? "border-b border-[#d9e2f0]" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                username={invite.from.username}
                avatarUrl={invite.from.avatar_url}
                index={index}
              />
              <div className="min-w-0">
                <p className="truncate font-lato text-sm font-bold text-[#304564]">
                  @{invite.from.username}
                </p>
                {invite.from.name && (
                  <p className="truncate font-lato text-xs text-[#6b7a90]">
                    {invite.from.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => handleDecline(invite)}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f2] text-[#be123c] transition-colors hover:bg-[#fce7f3] disabled:opacity-50"
                title="Decline"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleAccept(invite)}
                disabled={busy}
                className="flex h-8 items-center gap-1 rounded-full bg-secondary px-3 font-lato text-xs font-bold text-white transition-colors hover:bg-[#16327a] disabled:opacity-50"
              >
                <CheckIcon className="h-3 w-3" />
                {busy ? "…" : "Accept"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Friends() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = ((): "my-friends" | "add-friends" | "requests" => {
    const params = new URLSearchParams(location.search);
    const t = params.get("tab");
    if (t === "add") return "add-friends";
    if (t === "requests") return "requests";
    return "my-friends";
  })();

  const [activeTab, setActiveTab] = useState<"my-friends" | "add-friends" | "requests">(
    initialTab
  );
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <NavBar />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">
        <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col rounded-[1.75rem] bg-white/92 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:p-5 lg:p-7">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ff] text-secondary transition-colors hover:bg-[#dfe9fb]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="font-lato text-[0.7rem] font-bold uppercase tracking-[0.24em] text-secondary/55">
                Social
              </p>
              <h1 className="font-inter text-[2rem] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1f3668]">
                Friends
              </h1>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mt-6 flex gap-1 rounded-[1rem] bg-[#edf3ff] p-1">
            {(
              [
                { key: "my-friends", label: "My Friends" },
                { key: "requests", label: "Requests" },
                { key: "add-friends", label: "Add Friends" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex-1 rounded-[0.75rem] py-2 font-lato text-sm font-bold transition-all ${
                  activeTab === key
                    ? "bg-white text-secondary shadow-sm"
                    : "text-secondary/60 hover:text-secondary"
                }`}
              >
                {label}
                {key === "requests" && pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#be123c] font-lato text-[10px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="mt-5 flex-1">
            {activeTab === "my-friends" && <MyFriendsTab />}
            {activeTab === "requests" && (
              <RequestsTab onCountChange={setPendingCount} />
            )}
            {activeTab === "add-friends" && <AddFriendsTab />}
          </div>
        </section>
      </main>
    </div>
  );
}
