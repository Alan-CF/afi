import { useState, useEffect, useRef } from "react";
import NavBar from "../components/layout/NavBar";
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../lib/supabaseClient";
import AvatarUpload from "../components/ui/AvatarUpload";
import {
  FireIcon,
  StarIcon,
  TrophyIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon as HandThumbUpOutline,
  StarIcon as StarOutline,
  CheckIcon as CheckOutline,
  SunIcon as SunOutline,
} from "@heroicons/react/24/outline";
import { signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { fetchMyFriends, type FriendOption } from "../hooks/useRooms";

function getLeague(coins: number): { name: string; emoji: string } {
  if (coins <= 5000)  return { name: "Bronze",  emoji: "🥉" };
  if (coins <= 10000) return { name: "Silver",   emoji: "🥈" };
  if (coins <= 15000) return { name: "Gold",     emoji: "🥇" };
  if (coins <= 20000) return { name: "Sapphire", emoji: "♦️" };
  return { name: "Diamond", emoji: "💎" };
}

export default function MyProfile() {
  const { user, refreshProfile } = useProfile();
  const league = getLeague(user?.fanatic_coins ?? 0);

  const [isEditing, setIsEditing] = useState(false);
  const [nameText, setNameText] = useState("");
  const [usernameText, setUsernameText] = useState("");
  const [aboutText, setAboutText] = useState("Let us get to know you! Write a short bio about yourself.");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const friendsRowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const navigate = useNavigate();

  const onDragStart = (e: React.MouseEvent) => {
    const el = friendsRowRef.current;
    if (!el) return;
    dragState.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
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
    friendsRowRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  useEffect(() => {
    if (user) {
      if (user.name) setNameText(user.name);
      if (user.username) setUsernameText(user.username);
      if (user.caption) setAboutText(user.caption);
    }
  }, [user]);

  useEffect(() => {
    fetchMyFriends().then(setFriends).catch(() => {});
  }, []);

  const handleEdit = () => {
    setUsernameError(null);
    setIsEditing(true);
  };
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };
  const handleSave = async () => {
    const trimmedUsername = usernameText.trim();

    if (!trimmedUsername) {
      setUsernameError("Username cannot be empty.");
      return;
    }

    setSaving(true);

    // Verificar si el username ya existe (solo si cambió)
    if (trimmedUsername !== user?.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (existing) {
        setUsernameError("That username is already taken.");
        setSaving(false);
        return;
      }
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    await supabase
      .from("profiles")
      .update({
        name: nameText,
        username: trimmedUsername,
        caption: aboutText,
      })
      .eq("id", authUser?.id ?? "");

    await refreshProfile();
    setIsEditing(false);
    setUsernameError(null);
    setSaving(false);
  };

  const handleCancel = () => {
    // Revertir cambios
    if (user?.name) setNameText(user.name);
    if (user?.username) setUsernameText(user.username);
    if (user?.caption) setAboutText(user.caption);
    setUsernameError(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-text font-[family-name:var(--font-lato)]">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-12">

        {/* Info general */}
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] mb-5 overflow-hidden">
          <div className="flex flex-col md:flex-row">


            {/* Header azul */}
            <div className="bg-secondary flex flex-col items-center justify-center text-center px-10 py-8 md:w-80 md:shrink-0 md:rounded-l-2xl">
              
              <div className="mb-3">
                <AvatarUpload
                  avatarUrl={user?.avatar_url}
                  userId={user?.id ?? ""}
                  onUploadSuccess={() => refreshProfile()}
                />
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  maxLength={50}
                  placeholder="Full name"
                  className="bg-transparent border-b border-white/50 text-2xl font-extrabold text-white outline-none text-center w-full mb-1"
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl font-extrabold text-white mb-1">{nameText}</h1>
              )}

              {isEditing ? (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-white/60 text-sm">@</span>
                    <input
                      type="text"
                      value={usernameText}
                      onChange={(e) => {
                        setUsernameText(e.target.value);
                        setUsernameError(null);
                      }}
                      maxLength={30}
                      placeholder="username"
                      className="bg-transparent border-b border-white/50 text-sm text-white/80 outline-none text-center w-32"
                    />
                  </div>
                  {usernameError && (
                    <p className="mt-1 text-[11px] text-red-300 font-medium">{usernameError}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/80">@{usernameText}</p>
              )}
            </div>

            {/* Métricas */}
            <div className="flex flex-col justify-center flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <FireIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{(user?.streak ?? 0).toLocaleString()}</p>
                  <p className="text-[12px] uppercase tracking-wide text-gray-400 font-semibold">Streak</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <StarIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{(user?.fanatic_coins ?? 0).toLocaleString()}</p>
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
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">About me</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs font-bold text-secondary"
              >
                <PencilIcon className="h-3 w-3" />
                Edit profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="text-xs font-bold text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-bold text-secondary disabled:opacity-50"
                >
                  <CheckIcon className="h-3 w-3" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
          <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 flex items-center">
            <div className="rounded-xl bg-[var(--color-background)] border border-[var(--color-container-border)] shadow-sm px-4 py-3 text-sm text-gray-600 w-full">
              {isEditing ? (
                <input
                  type="text"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  maxLength={200}
                  className="w-full bg-transparent outline-none text-gray-600"
                />
              ) : (
                <div>{aboutText}</div>
              )}
            </div>
          </section>
          {isEditing && aboutText.length >= 200 && (
            <p className="mt-2 text-xs font-medium text-red-500">There's a 200 character limit.</p>
          )}
        </div>

        {/* My Friends */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">My Friends</h2>
          <button
            onClick={() => navigate("/friends")}
            className="text-xs font-bold text-secondary"
          >
            View All
          </button>
        </div>
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 mb-5">
          <div
            ref={friendsRowRef}
            className="flex gap-4 overflow-x-auto pb-1 cursor-grab select-none"
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onMouseMove={onDragMove}
          >
            {/* Add friend button */}
            <button
              onClick={() => navigate("/friends?tab=add")}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-secondary bg-[var(--color-background)]">
                <PlusIcon className="h-6 w-6 text-secondary" />
              </div>
              <span className="text-[10px] font-semibold text-secondary">Add</span>
            </button>

            {/* Friend circles */}
            {friends.map((friend) => (
              <div key={friend.id} className="flex flex-col items-center gap-1 shrink-0">
                {friend.avatar_url ? (
                  <div className="h-14 w-14 rounded-full overflow-hidden shrink-0">
                    <img
                      src={friend.avatar_url}
                      alt={friend.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-extrabold"
                    style={{ backgroundColor: friend.accent }}
                  >
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] font-semibold text-gray-500 max-w-[56px] truncate">
                  @{friend.name}
                </span>
              </div>
            ))}

            {friends.length === 0 && (
              <p className="text-sm text-gray-400 self-center">No friends yet. Add some!</p>
            )}
          </div>
        </section>

        {/* Achievements */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">Achievements</h2>
            <button className="text-xs font-bold text-secondary">View All</button>
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

        {/* Points History */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">Points History</h2>
          <button className="text-xs font-bold text-secondary">See All</button>
        </div>
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4">
          <div className="flex flex-col gap-3">
            {(() => {
              const item = {
                title: "Daily login",
                subtitle: "Welcome back to AFI · 2/27/2026",
                points: "+10",
                icon: <ClockIcon className="h-5 w-5 text-gray-400" />,
              };
              return (
                <div className="flex items-center gap-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-container-border)] shadow-sm p-3 w-full">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e0e6f0]">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-secondary">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </div>
                  <p className="text-base font-extrabold text-primary">{item.points}</p>
                </div>
              );
            })()}
          </div>
        </section>
        {/* Logout */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLogout}
            className="text-s font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}