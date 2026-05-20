import type { ComponentType, SVGProps } from "react";

import {
  FireIcon,
  StarIcon,
  BoltIcon,
  ArrowPathIcon,
  CameraIcon,
  UserPlusIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/solid";

type EventIcon = ComponentType<SVGProps<SVGSVGElement>>;

const EVENT_ICONS: Record<string, EventIcon> = {
  daily_login: FireIcon,
  streak_3: BoltIcon,
  streak_7: BoltIcon,
  streak_25: TrophyIcon,
  streak_50: TrophyIcon,
  return_after_break: ArrowPathIcon,
  add_pfp: CameraIcon,
  add_friend: UserPlusIcon,
  add_caption: ChatBubbleBottomCenterTextIcon,
};

const EVENT_COLORS: Record<string, string> = {
  daily_login: "bg-orange-500",
  streak_3: "bg-blue-500",
  streak_7: "bg-blue-600",
  streak_25: "bg-purple-600",
  streak_50: "bg-yellow-500",
  return_after_break: "bg-green-500",
  add_pfp: "bg-pink-500",
  add_friend: "bg-teal-500",
  add_caption: "bg-indigo-500",
};

type Props = {
  points: number;
  label: string;
  description?: string;
  eventKey?: string;
  onDone: () => void;
};

export default function PointsToast({
  points,
  label,
  description,
  eventKey,
  onDone,
}: Props) {
  const Icon: EventIcon = EVENT_ICONS[eventKey ?? ""] ?? StarIcon;
  const iconColor = EVENT_COLORS[eventKey ?? ""] ?? "bg-secondary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[3px] sm:items-center"
      onClick={onDone}
    >
      <div
        className="w-full max-w-md rounded-t-[2rem] bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.22)] sm:rounded-[2rem] sm:shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#d7dce6]" />
        </div>

        <div className="p-7 pt-5">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-lato text-[0.62rem] uppercase tracking-[0.3em] text-[#8b94a3]">
              Points Earned
            </p>
          </div>

          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-[1.75rem] ${iconColor}`}
              >
                <Icon className="h-11 w-11 text-white" />
              </div>
            </div>

            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3.5 py-1 font-lato text-[0.75rem] font-bold uppercase tracking-[0.2em] text-green-700">
              +{points} points
            </span>
          </div>

          <h2 className="mb-1.5 text-center font-lato text-[1.4rem] font-black tracking-tight text-secondary">
            {label}
          </h2>

          <hr className="mb-4 border-[#eef3fb]" />

          {description && (
            <div className="mb-3 rounded-xl bg-[#f8fbff] px-4 py-3.5">
              <p className="font-lato text-sm font-semibold text-secondary">
                {description}
              </p>
            </div>
          )}

          <button
            onClick={onDone}
            className="w-full py-3.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}