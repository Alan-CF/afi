import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  BoltIcon,
  FireIcon,
  HomeIcon,
  LockClosedIcon,
  StarIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import NavBar from "../../components/layout/NavBar";
import Footer from "../../components/layout/Footer";
import AchievementDetailModal from "../../components/ui/achievements/AchievementDetailModal";
import { useAchievements } from "../../hooks/useAchievements";
import type { Achievement, AchievementId } from "../../data/achievements";

const ICONS: Record<AchievementId, React.ElementType> = {
  "first-spark": FireIcon,
  "ten-day-flame": BoltIcon,
  "century-fan": TrophyIcon,
  "new-teammate": UserPlusIcon,
  "squad-builder": UsersIcon,
  "room-rookie": HomeIcon,
  "quiz-debut": AcademicCapIcon,
};

export default function Achievements() {
  const navigate = useNavigate();
  const { achievements, loading } = useAchievements();
  const [selected, setSelected] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#eef3fb]">
      <NavBar />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 py-3 sm:px-5 sm:py-6 xl:px-8">
        <section className="rounded-[1.75rem] bg-white/95 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] sm:p-5 lg:p-7">
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
                Your Progress
              </p>
              <h1 className="font-inter text-[2rem] font-semibold leading-[0.92] tracking-[-0.03em] text-[#1f3668]">
                Achievements
              </h1>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-[1rem] bg-[#edf3ff] p-4">
              <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.22em] text-secondary/60">
                Unlocked
              </p>
              <p className="mt-1 font-lato text-3xl font-black text-secondary">
                {loading ? "-" : unlockedCount}
                <span className="text-base font-normal text-secondary/55">
                  /{loading ? "-" : total}
                </span>
              </p>
            </div>

            <div className="rounded-[1rem] border-2 border-[#d9e2f0] bg-[#fdfefe] p-4">
              <div className="flex items-center justify-between gap-3 font-lato text-xs text-[#6b7a90]">
                <span>Overall progress</span>
                {!loading && (
                  <span className="font-bold text-secondary">
                    {unlockedCount} of {total} achievements
                  </span>
                )}
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e4eaf4]">
                <div
                  className="h-2.5 rounded-full bg-secondary transition-all duration-700"
                  style={{ width: loading ? "0%" : `${percent}%` }}
                />
              </div>
              <p className="mt-2 font-lato text-xs font-bold text-secondary">
                {loading ? "-" : percent}%
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-[1.5rem] bg-[#f4f7fb] sm:h-44"
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => setSelected(achievement)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <AchievementDetailModal
          achievement={selected}
          onClose={() => setSelected(null)}
        />
      )}
      <Footer />
    </div>
  );
}

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick: () => void;
}) {
  const {
    id,
    name,
    color,
    unlocked,
    progressCurrent,
    progressTarget,
    progressLabel,
    unlockedAt,
  } = achievement;

  const Icon = ICONS[id];
  const progress = progressTarget > 0 ? (progressCurrent / progressTarget) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`group relative flex min-h-36 w-full flex-col items-center justify-center gap-1.5 rounded-[1rem] border-2 px-2 py-3 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:min-h-44 sm:gap-3 sm:rounded-[1.5rem] sm:px-4 sm:py-5 ${
        unlocked
          ? "border-[#cfd9ea] bg-[#fdfefe] hover:border-secondary"
          : "border-[#d9e2f0] bg-[#f8fbff] hover:border-[#cfd9ea]"
      }`}
    >
      {unlocked && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#edf3ff] text-secondary">
          <StarIcon className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="relative">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors sm:h-16 sm:w-16 ${
            unlocked ? color : "bg-[#edf3ff]"
          }`}
        >
          <Icon
            className={`h-5 w-5 sm:h-8 sm:w-8 ${unlocked ? "text-white" : "text-[#8aa0bd]"}`}
          />
        </div>
        {!unlocked && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d1d9e4]">
            <LockClosedIcon className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      <h3
        className={`font-lato text-[0.6rem] font-black leading-tight sm:text-sm ${
          unlocked ? "text-secondary" : "text-[#9aa5b4]"
        }`}
      >
        {name}
      </h3>

      {unlocked ? (
        <div className="flex flex-col items-center gap-1">
          <span className="rounded-full bg-[#edf3ff] px-3 py-0.5 font-lato text-[0.58rem] font-bold uppercase tracking-[0.18em] text-secondary">
            Unlocked
          </span>
          {unlockedAt && (
            <p className="hidden font-lato text-[0.58rem] text-[#8b94a3] sm:block">
              {unlockedAt}
            </p>
          )}
        </div>
      ) : (
        <div className="w-full">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e4e9f0]">
            <div
              className="h-1.5 rounded-full bg-secondary transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-1 font-lato text-[0.58rem] text-[#9aa5b4]">
            {progressLabel}
          </p>
        </div>
      )}
    </button>
  );
}
