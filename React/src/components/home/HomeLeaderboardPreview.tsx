import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";

export default function HomeLeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(5);

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <div>
          <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
            Leaderboard
          </h2>
          <p className="font-lato text-sm text-text-light mt-1">
            Top fans this week
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ranking")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors shrink-0"
        >
          Full leaderboard →
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-container-border p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 py-3 border-b border-container-border/40 last:border-0 fade-in-up stagger-${i + 1}`}
              >
                <div className="w-7 h-4 rounded skeleton-shimmer shrink-0" />
                <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 h-4 rounded skeleton-shimmer" />
                <div className="w-16 h-4 rounded skeleton-shimmer shrink-0" />
              </div>
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="font-lato text-sm text-text-light text-center py-8">
            Tip-off hasn't happened. Be the first on the board.
          </p>
        ) : (
          <ol className="flex flex-col">
            {top.map((entry, i) => (
              <li
                key={entry.profileId}
                className={`flex items-center gap-3 md:gap-4 border-b border-container-border/40 last:border-0 fade-in-up stagger-${Math.min(i + 1, 6)} ${
                  i === 0
                    ? "py-4 -mx-4 md:-mx-6 px-4 md:px-6 bg-primary/[0.06] rounded-2xl"
                    : "py-3"
                }`}
              >
                <span
                  className={`font-anton tabular-nums w-7 text-right shrink-0 ${
                    i === 0 ? "text-xl text-primary" : "text-base text-secondary/40"
                  }`}
                >
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <div
                  className={`shrink-0 rounded-full overflow-hidden bg-secondary ${
                    i === 0 ? "h-11 w-11" : "h-9 w-9"
                  }`}
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <UserCircleIcon className="h-full w-full text-white/70" />
                  )}
                </div>
                <span
                  className={`flex-1 min-w-0 truncate font-lato font-bold ${
                    i === 0 ? "text-base text-secondary" : "text-sm text-text"
                  }`}
                >
                  @{entry.username}
                </span>
                <span
                  className={`font-anton tabular-nums shrink-0 ${
                    i === 0 ? "text-xl text-secondary" : "text-base text-secondary/65"
                  }`}
                >
                  {entry.points.toLocaleString()}
                </span>
              </li>
            ))}

            {me && !top.some((e) => e.profileId === me.profileId) && (
              <>
                <li className="my-2 border-t border-container-border" aria-hidden />
                <li className="flex items-center gap-3 md:gap-4 py-3 -mx-4 md:-mx-6 px-4 md:px-6 bg-primary/[0.04] rounded-2xl fade-in-up stagger-6">
                  <span className="font-anton text-base tabular-nums w-7 text-right shrink-0 text-secondary">
                    {String(me.rank).padStart(2, "0")}
                  </span>
                  <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-secondary">
                    {me.avatarUrl ? (
                      <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-white/70" />
                    )}
                  </div>
                  <span className="flex-1 min-w-0 truncate font-lato font-bold text-sm text-text">You</span>
                  <span className="font-anton text-base tabular-nums shrink-0 text-primary">
                    {me.points.toLocaleString()}
                  </span>
                </li>
              </>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}
