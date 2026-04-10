import { useState, useEffect } from "react";
import NavBar from "../components/layout/NavBar";
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../lib/supabaseClient";
import {
  FireIcon,
  StarIcon,
  UserIcon,
  TrophyIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon as HandThumbUpOutline,
  StarIcon as StarOutline,
  CheckIcon as CheckOutline,
  SunIcon as SunOutline,
} from "@heroicons/react/24/outline";

function getLeague(coins: number): { name: string; emoji: string } {
  if (coins <= 5000)  return { name: "Bronze", emoji: "🥉" };
  if (coins <= 10000) return { name: "Silver",  emoji: "🥈" };
  if (coins <= 15000) return { name: "Gold",    emoji: "🥇" };
  if (coins <= 20000) return { name: "Sapphire", emoji: "♦️" };
  return { name: "Diamond", emoji: "💎" };
}
export default function MyProfile() {
  const { user } = useProfile();
  const handle = user?.username ?? "username";
  const name = user?.full_name ?? user?.username ?? "Full Name";
  const league = getLeague(user?.fanatic_coins ?? 0);

  const [aboutText, setAboutText] = useState<string>("Let us get to know you! Write a short bio about yourself.");

  useEffect(() => {
    if (user?.caption) {
      setAboutText(user.caption);
    }
  }, [user]);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSave = async () => {
    if (isEditing) {
      await supabase
        .from("profiles")
        .update({ caption: aboutText })
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-text">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-12">

        {/* Info general */}
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] mb-5 overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Header azul — avatar + nombre */}
            <div className="bg-secondary flex flex-col items-center justify-center text-center px-10 py-8 md:w-80 md:shrink-0 md:rounded-l-2xl">
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-secondary/60 border-4 border-white/20 mb-3 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="h-[88px] w-[88px] rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-11 w-11 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-2">{name}</h1>
              <p className="text-sm text-white/80">@{handle}</p>
            </div>

            {/* Métricas */}
            <div className="flex flex-col justify-center flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <FireIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{user?.streak ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Streak</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <StarIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xl font-extrabold text-secondary">{user?.fanatic_coins ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Points</p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[var(--color-container-border)] shadow-sm bg-[var(--color-background)] p-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <TrophyIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xl font-extrabold text-secondary">{league.emoji}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{league.name}</p>
              </div>
              </div>
            </div>

          </div>
        </section>

        {/* About me + achievements (para vista en computadora) */}
        <div className="flex flex-col md:flex-row gap-5 mb-5">

          {/* About me */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text)]">About me</h2>
              <button
                className="text-xs font-bold text-secondary"
                onClick={handleEditSave}
                disabled={isEditing && aboutText.length > 200}
              >
                {isEditing ? "Save" : "Edit"}
              </button>
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
                    autoFocus
                  />
                ) : (
                  <div>{aboutText}</div>
                )}
              </div>
            </section>
            {isEditing && aboutText.length >= 200 ? (
              <p className="mt-2 text-xs font-medium text-red-500">There's a 200 character limit.</p>
            ) : null}
          </div>

          {/* Achievements */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text)]">Achievements</h2>
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
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text)]">Points History</h2>
          <button className="text-xs font-bold text-secondary">See All</button>
        </div>
        <section className="rounded-2xl border border-gray-200 bg-[var(--color-text-light-soft)] p-4">
          <div className="flex flex-col gap-3">
            {(() => {
              const item = [
                {
                  title: "Daily login",
                  subtitle: "Welcome back to AFI · 2/27/2026",
                  points: "+10",
                  icon: <ClockIcon className="h-5 w-5 text-gray-400" />,
                },
              ][0]; {/* Para mostrar el mas reciente */}
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

      </main>
    </div>
  );
}