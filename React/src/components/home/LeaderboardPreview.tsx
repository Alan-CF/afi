import { useNavigate } from "react-router-dom";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(3);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const isInTop = me ? top.some((t) => t.profileId === me.profileId) : false;

  return (
    <div className="flex flex-col">
      {top.map((entry) => (
        <div
          key={entry.profileId}
          className="flex items-center gap-4 py-3 border-b border-container-border"
        >
          <span className="font-anton text-xl text-secondary w-8 text-right shrink-0">
            {String(entry.rank).padStart(2, "0")}
          </span>
          <span className="font-lato text-base text-text flex-1 truncate">
            @{entry.username}
          </span>
          <span className="font-lato text-sm text-text-light tabular-nums">
            {entry.points.toLocaleString()}
          </span>
        </div>
      ))}

      {me && !isInTop && (
        <div className="flex items-center gap-4 py-3 mt-3 border-t border-container-border">
          <span className="font-anton text-xl text-secondary w-8 text-right shrink-0">
            {String(me.rank).padStart(2, "0")}
          </span>
          <span className="font-lato text-base text-secondary flex-1 font-bold truncate">
            you
          </span>
          <span className="font-lato text-sm text-text-light tabular-nums">
            {me.points.toLocaleString()}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/ranking")}
        className="mt-4 font-anton text-base text-secondary lowercase hover:text-primary transition-colors text-left"
      >
        full leaderboard →
      </button>
    </div>
  );
}
