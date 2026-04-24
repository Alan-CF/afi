import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";
import type { LeaderboardEntry } from "../../hooks/useLeaderboardPreview";

function LeaderRow({ entry, isMe = false }: { entry: LeaderboardEntry; isMe?: boolean }) {
  return (
    <div className={`flex items-center gap-4 py-3 md:py-4 ${isMe ? "bg-primary/5 rounded-xl px-3 -mx-3" : ""}`}>
      <span className={`font-anton text-xl w-8 text-right shrink-0 tabular-nums ${isMe ? "text-primary" : "text-secondary"}`}>
        {String(entry.rank).padStart(2, "0")}
      </span>
      <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserCircleIcon className="h-10 w-10 text-text-light" />
        )}
      </div>
      <span className={`font-lato flex-1 truncate ${isMe ? "font-bold text-secondary" : "text-text"}`}>
        {isMe ? "You" : `@${entry.username}`}
      </span>
      <span className={`font-lato text-sm font-bold tabular-nums ${isMe ? "text-primary" : "text-secondary"}`}>
        {entry.points.toLocaleString()}
      </span>
    </div>
  );
}

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(3);

  if (loading) {
    return (
      <div className="rounded-3xl border border-container-border bg-white p-6 md:p-8">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const isInTop = me ? top.some((t) => t.profileId === me.profileId) : false;

  return (
    <div className="rounded-3xl border border-container-border bg-white p-6 md:p-8">
      <div className="flex flex-col divide-y divide-container-border">
        {top.map((entry) => (
          <LeaderRow key={entry.profileId} entry={entry} />
        ))}
      </div>

      {me && !isInTop && (
        <div className="border-t border-container-border mt-3 pt-3">
          <LeaderRow entry={me} isMe />
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/ranking")}
        className="mt-6 font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
      >
        Full Leaderboard →
      </button>
    </div>
  );
}
