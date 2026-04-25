import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";
import type { LeaderboardEntry } from "../../hooks/useLeaderboardPreview";

function Avatar({ url, size = "md" }: { url?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16" : size === "md" ? "h-12 w-12" : "h-8 w-8";
  return (
    <div className={`${cls} rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/30`}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserCircleIcon className={`${cls} text-white/60`} />
      )}
    </div>
  );
}

function PodiumSlot({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const barHeight = { 1: "h-32", 2: "h-24", 3: "h-16" };
  const barBg = { 1: "bg-primary", 2: "bg-surface-dark", 3: "bg-secondary" };
  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const avatarSize: "lg" | "md" | "sm" = position === 1 ? "lg" : "md";

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <Avatar url={entry.avatarUrl} size={avatarSize} />
      <p className="font-lato text-xs font-bold text-secondary truncate max-w-[90px] text-center mt-2">
        @{entry.username}
      </p>
      <p className="font-lato text-[0.65rem] text-text-light tabular-nums mt-0.5">
        {entry.points.toLocaleString()}
      </p>
      <div className={`${barHeight[position]} ${barBg[position]} w-full mt-2 rounded-t-xl flex items-center justify-center`}>
        <span className="text-2xl">{medal[position]}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(3);

  if (loading) {
    return (
      <div className="rounded-3xl border border-container-border bg-white p-6 md:p-8">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const first = top.find((e) => e.rank === 1);
  const second = top.find((e) => e.rank === 2);
  const third = top.find((e) => e.rank === 3);
  const isInTop = me ? top.some((t) => t.profileId === me.profileId) : false;

  return (
    <div className="rounded-3xl border border-container-border bg-white p-6 md:p-8">

      {first && (
        <div className="flex items-end gap-2">
          {second && <PodiumSlot entry={second} position={2} />}
          <PodiumSlot entry={first} position={1} />
          {third && <PodiumSlot entry={third} position={3} />}
        </div>
      )}

      {me && !isInTop && (
        <div className="mt-4 border-t border-container-border pt-4 flex items-center gap-3">
          <span className="font-anton text-xl text-primary w-8 text-right shrink-0 tabular-nums">
            {String(me.rank).padStart(2, "0")}
          </span>
          <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {me.avatarUrl ? (
              <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-text-light" />
            )}
          </div>
          <span className="font-lato font-bold text-secondary flex-1 truncate">You</span>
          <span className="font-lato text-sm font-bold text-primary tabular-nums">
            {me.points.toLocaleString()}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/ranking")}
        className="mt-4 w-full font-lato text-sm font-bold text-secondary hover:text-primary transition-colors text-center"
      >
        Full Leaderboard →
      </button>
    </div>
  );
}
