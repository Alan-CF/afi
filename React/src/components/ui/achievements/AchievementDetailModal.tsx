import {
  XMarkIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  FireIcon,
  BoltIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  HomeIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import type { Achievement, AchievementId } from "../../../data/achievements";

const ICONS: Record<AchievementId, React.ElementType> = {
  "first-spark": FireIcon,
  "ten-day-flame": BoltIcon,
  "century-fan": TrophyIcon,
  "new-teammate": UserPlusIcon,
  "squad-builder": UsersIcon,
  "room-rookie": HomeIcon,
  "quiz-debut": AcademicCapIcon,
};

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementDetailModal({ achievement, onClose }: Props) {
  const {
    id,
    name,
    description,
    requirement,
    color,
    unlocked,
    progressCurrent,
    progressTarget,
    progressLabel,
    unlockedAt,
  } = achievement;

  const Icon = ICONS[id];
  const progress = progressTarget > 0 ? (progressCurrent / progressTarget) * 100 : 0;
  const remaining = progressTarget - progressCurrent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[3px] sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[2rem] bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.22)] sm:rounded-[2rem] sm:shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#d7dce6]" />
        </div>

        <div className="p-7 pt-5">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="font-lato text-[0.62rem] uppercase tracking-[0.3em] text-[#8b94a3]">
              Achievement
            </p>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#667085] transition hover:bg-[#e2e8f0] active:scale-95"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Badge */}
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-[1.75rem] transition-all ${
                  unlocked ? color : "bg-[#edf0f7]"
                }`}
              >
                <Icon
                  className={`h-11 w-11 ${unlocked ? "text-white" : "text-[#b0bac8]"}`}
                />
              </div>
              {unlocked && (
                <div className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb] shadow-md">
                  <CheckBadgeIcon className="h-4 w-4 text-white" />
                </div>
              )}
              {!unlocked && (
                <div className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#d1d9e4] shadow-sm">
                  <LockClosedIcon className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            {unlocked ? (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 font-lato text-[0.62rem] font-bold uppercase tracking-[0.2em] text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                Unlocked
              </span>
            ) : progressCurrent > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 font-lato text-[0.62rem] font-bold uppercase tracking-[0.2em] text-blue-600">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                In Progress
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-3.5 py-1 font-lato text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#8b94a3]">
                <LockClosedIcon className="h-2.5 w-2.5" />
                Locked
              </span>
            )}
          </div>

          {/* Name + description */}
          <h2 className="mb-1.5 text-center font-lato text-[1.4rem] font-black tracking-tight text-secondary">
            {name}
          </h2>
          <p className="mb-6 text-center font-lato text-sm leading-relaxed text-[#667085]">
            {description}
          </p>

          <hr className="mb-4 border-[#eef3fb]" />

          {/* Requirement */}
          <div className="mb-3 rounded-xl bg-[#f8fbff] px-4 py-3.5">
            <p className="mb-1 font-lato text-[0.58rem] uppercase tracking-[0.24em] text-[#8b94a3]">
              How to Unlock
            </p>
            <p className="font-lato text-sm font-semibold text-secondary">
              {requirement}
            </p>
          </div>

          {/* Progress or unlock date */}
          {unlocked ? (
            <div className="rounded-xl bg-blue-50 px-4 py-3.5">
              <p className="mb-1 font-lato text-[0.58rem] uppercase tracking-[0.24em] text-blue-500">
                {unlockedAt ? "Obtained On" : "Status"}
              </p>
              <p className="font-lato text-sm font-semibold text-blue-700">
                {unlockedAt ?? "Completed"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#f8fbff] px-4 py-3.5">
              <div className="mb-2 flex items-center justify-between font-lato text-xs">
                <span className="text-[#8b94a3]">Your Progress</span>
                <span className="font-bold text-secondary">{progressLabel}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#e8edf5]">
                <div
                  className="h-2.5 rounded-full bg-secondary transition-all duration-700"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="mt-2 font-lato text-xs text-[#8b94a3]">
                {remaining > 0
                  ? `${remaining} more to go`
                  : "Complete the requirement to unlock!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
