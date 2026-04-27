import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";
import LeaderboardPodium, { type PodiumEntry } from "../common/LeaderboardPodium";

export default function HomeLeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(10);

  const top3: PodiumEntry[] = top.slice(0, 3).map((e) => ({
    profile_id: e.profileId,
    rank: e.rank,
    username: e.username,
    points: e.points,
    avatar_url: e.avatarUrl,
  }));

  const list = top.slice(3, 10);
  const meInList = me ? top.some((e) => e.profileId === me.profileId) : false;
  const meRow =
    me && !meInList
      ? {
          profile_id: me.profileId,
          rank: me.rank,
          username: me.username,
          points: me.points,
          avatar_url: me.avatarUrl,
        }
      : null;

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <div>
          <h2 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
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

      <div className="rounded-3xl bg-white border border-container-border p-5 md:p-7">
        {loading ? (
          <>
            <div className="grid grid-cols-3 items-end gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-16 rounded skeleton-shimmer" />
                  <div className={`${i === 1 ? "h-16" : i === 0 ? "h-10" : "h-8"} w-full rounded-t-2xl skeleton-shimmer`} />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-7 h-4 rounded skeleton-shimmer" />
                  <div className="h-9 w-9 rounded-full skeleton-shimmer" />
                  <div className="flex-1 h-4 rounded skeleton-shimmer" />
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>
          </>
        ) : top.length === 0 ? (
          <p className="font-lato text-sm text-text-light text-center py-8">
            Tip-off hasn't happened. Be the first on the board.
          </p>
        ) : (
          <>
            <LeaderboardPodium top3={top3} meId={me?.profileId ?? null} size="compact" />

            {(list.length > 0 || meRow) && (
              <ol className="mt-6 max-h-[260px] overflow-y-auto pr-1 -mr-1 flex flex-col">
                {list.map((entry) => {
                  const isMe = me?.profileId === entry.profileId;
                  return (
                    <li
                      key={entry.profileId}
                      className={`flex items-center gap-3 py-3 border-b border-container-border/40 last:border-0 ${isMe ? "bg-primary/[0.06] -mx-2 px-2 rounded-xl" : ""}`}
                    >
                      <span className="font-anton text-base tabular-nums w-7 text-right shrink-0 text-secondary/60">
                        {String(entry.rank).padStart(2, "0")}
                      </span>
                      <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-secondary">
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
                      <span className="flex-1 min-w-0 truncate font-lato font-bold text-sm text-text">
                        @{entry.username}
                        {isMe && (
                          <span className="ml-2 inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
                            YOU
                          </span>
                        )}
                      </span>
                      <span className="font-anton text-base tabular-nums shrink-0 text-secondary/70">
                        {entry.points.toLocaleString()}
                      </span>
                    </li>
                  );
                })}

                {meRow && (
                  <>
                    <li className="my-2 border-t-2 border-container-border" aria-hidden />
                    <li className="flex items-center gap-3 py-3 -mx-2 px-2 bg-primary/[0.08] rounded-xl">
                      <span className="font-anton text-base tabular-nums w-7 text-right shrink-0 text-secondary">
                        {meRow.rank > 99 ? `${meRow.rank}` : String(meRow.rank).padStart(2, "0")}
                      </span>
                      <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-secondary">
                        {meRow.avatar_url ? (
                          <img
                            src={meRow.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <UserCircleIcon className="h-full w-full text-white/70" />
                        )}
                      </div>
                      <span className="flex-1 min-w-0 truncate font-lato font-bold text-sm text-text">
                        You
                        <span className="ml-2 inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
                          YOU
                        </span>
                      </span>
                      <span className="font-anton text-base tabular-nums shrink-0 text-primary">
                        {meRow.points.toLocaleString()}
                      </span>
                    </li>
                  </>
                )}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}
