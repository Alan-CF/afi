import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import {
  ArrowLeftIcon,
  FireIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon as HandThumbUpOutline,
  StarIcon as StarOutline,
  CheckIcon as CheckOutline,
  SunIcon as SunOutline,
} from "@heroicons/react/24/outline";
import {
  fetchPublicProfileById,
  fetchPublicFriendsByProfileId,
  type PublicProfile as PublicProfileData,
  type PublicFriend,
} from "../lib/friends";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENTS = [
  "#8FB3E8", "#B8C9E8", "#9CB6E6", "#C8D6F2",
  "#A4BCE9", "#8CA8DB", "#B5C4E0", "#9FB3D8",
];

function getLeague(coins: number): { name: string; emoji: string } {
  if (coins <= 5000)  return { name: "Bronze",  emoji: "🥉" };
  if (coins <= 10000) return { name: "Silver",  emoji: "🥈" };
  if (coins <= 15000) return { name: "Gold",    emoji: "🥇" };
  if (coins <= 20000) return { name: "Sapphire", emoji: "♦️" };
  return { name: "Diamond", emoji: "💎" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [friends, setFriends] = useState<PublicFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const friendsRowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0, moved: false });

  const onDragStart = (e: React.MouseEvent) => {
    const el = friendsRowRef.current;
    if (!el) return;
    dragState.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
  };
  const onDragEnd = () => {
    dragState.current.dragging = false;
    if (friendsRowRef.current) friendsRowRef.current.style.cursor = "grab";
  };
  const onDragMove = (e: React.MouseEvent) => {
    if (!dragState.current.dragging || !friendsRowRef.current) return;
    e.preventDefault();
    const x = e.pageX - friendsRowRef.current.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 4) dragState.current.moved = true;
    friendsRowRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchPublicProfileById(profileId),
      fetchPublicFriendsByProfileId(profileId),
    ])
      .then(([prof, frns]) => {
        if (!prof) { setError("Profile not found."); return; }
        setProfile(prof);
        setFriends(frns);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load profile.")
      )
      .finally(() => setLoading(false));
  }, [profileId]);

  const league = getLeague(profile?.fanatic_coins ?? 0);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
        <NavBar />
        <div className="flex items-center justify-center pt-24">
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
        <NavBar />
        <div className="flex flex-col items-center justify-center gap-4 pt-24">
          <p className="text-sm text-gray-500">{error ?? "Profile not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-bold text-secondary"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-text font-[family-name:var(--font-lato)]">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-12">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-bold text-secondary transition-colors hover:text-secondary/70"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        {/* Info card */}
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] mb-5 overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Blue header */}
            <div className="bg-secondary flex flex-col items-center justify-center text-center px-10 py-8 md:w-80 md:shrink-0 md:rounded-l-2xl">
              <div className="mb-3">
                {profile.avatar_url ? (
                  <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/30">
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-extrabold text-white">
                    {(profile.name ?? profile.username)[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-1">
                {profile.name ?? profile.username}
              </h1>
              <p className="text-sm text-white/80">@{profile.username}</p>
            </div>

            {/* Metrics */}
            <div className="flex flex-col justify-center flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <FireIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{(profile.streak).toLocaleString()}</p>
                  <p className="text-[12px] uppercase tracking-wide text-gray-400 font-semibold">Streak</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <StarIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{(profile.fanatic_coins).toLocaleString()}</p>
                  <p className="text-[12px] uppercase tracking-wide text-gray-400 font-semibold">Points</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <TrophyIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{league.emoji}</p>
                  <p className="text-[12px] uppercase tracking-wide text-gray-400 font-semibold">{league.name}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About me */}
        <div className="mb-5">
          <div className="flex items-center mb-2 px-1">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">About me</h2>
          </div>
          <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 flex items-center">
            <div className="rounded-xl bg-[var(--color-background)] border border-[var(--color-container-border)] shadow-sm px-4 py-3 text-sm text-gray-600 w-full">
              {profile.caption ?? "No bio yet."}
            </div>
          </section>
        </div>

        {/* Friends */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">Friends</h2>
        </div>
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 mb-5">
          {friends.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No friends to show.</p>
          ) : (
            <div
              ref={friendsRowRef}
              className="flex gap-4 overflow-x-auto pb-1 cursor-grab select-none"
              onMouseDown={onDragStart}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onMouseMove={onDragMove}
            >
              {friends.map((friend, index) => (
                <button
                  key={friend.id}
                  onClick={() => { if (!dragState.current.moved) navigate(`/profile/${friend.id}`); }}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  {friend.avatar_url ? (
                    <div className="h-14 w-14 rounded-full overflow-hidden shrink-0">
                      <img
                        src={friend.avatar_url}
                        alt={friend.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-extrabold"
                      style={{ backgroundColor: ACCENTS[index % ACCENTS.length] }}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-semibold text-gray-500 max-w-[56px] truncate">
                    @{friend.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Achievements */}
        <div className="mb-5">
          <div className="flex items-center mb-2 px-1">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">Achievements</h2>
          </div>
          <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: <HandThumbUpOutline className="h-6 w-6 text-secondary" /> },
                { icon: <StarOutline className="h-6 w-6 text-secondary" /> },
                { icon: <CheckOutline className="h-6 w-6 text-secondary" /> },
                { icon: <SunOutline className="h-6 w-6 text-secondary" /> },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-2xl border-4 border-secondary bg-[var(--color-background)] py-5"
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
