import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon as HandThumbUpOutline,
  StarIcon as StarOutline,
  CheckIcon as CheckOutline,
  SunIcon as SunOutline,
} from "@heroicons/react/24/outline";
import { signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ui/ConfirmDialog";

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
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.name) setNameText(user.name);
      if (user.username) setUsernameText(user.username);
      if (user.caption) setAboutText(user.caption);
    }
  }, [user]);

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

        {/* About me + Achievements */}
        <div className="flex flex-col md:flex-row gap-5 mb-5">

          {/* About me */}
          <div className="flex-1">
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
            <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 h-[calc(100%-28px)] flex items-center">
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

          {/* Achievements */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--color-text)]">Achievements</h2>
              <button className="text-xs font-bold text-secondary">View All</button>
            </div>
            <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4 h-[calc(100%-28px)]">
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
            onClick={() => setShowLogoutConfirm(true)}
            className="text-s font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            Log out
          </button>
        </div>

        <ConfirmDialog
          isOpen={showLogoutConfirm}
          title="Log out of AFI?"
          message="You'll need to sign in again to access your account."
          confirmLabel="Log out"
          cancelLabel="Cancel"
          destructive
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </main>
    </div>
  );
}