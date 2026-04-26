import { UserCircleIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useLeaderboard } from "../hooks/useRanking";
import { useProfile } from "../hooks/useProfile";
import EmptyState from "../components/common/EmptyState";

function LaurelIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M 8 16 Q 6 12, 8 8 Q 10 10, 9 14" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M 8 16 Q 6 18, 7 22 Q 10 20, 9 17" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <ellipse cx="6" cy="11" rx="2.5" ry="1.2" transform="rotate(-30 6 11)" fill="currentColor" />
      <ellipse cx="6" cy="20" rx="2.5" ry="1.2" transform="rotate(30 6 20)" fill="currentColor" />
      <ellipse cx="9" cy="14" rx="2" ry="1" transform="rotate(-50 9 14)" fill="currentColor" />
      <ellipse cx="9" cy="18" rx="2" ry="1" transform="rotate(50 9 18)" fill="currentColor" />
      <path d="M 24 16 Q 26 12, 24 8 Q 22 10, 23 14" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M 24 16 Q 26 18, 25 22 Q 22 20, 23 17" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <ellipse cx="26" cy="11" rx="2.5" ry="1.2" transform="rotate(30 26 11)" fill="currentColor" />
      <ellipse cx="26" cy="20" rx="2.5" ry="1.2" transform="rotate(-30 26 20)" fill="currentColor" />
      <ellipse cx="23" cy="14" rx="2" ry="1" transform="rotate(50 23 14)" fill="currentColor" />
      <ellipse cx="23" cy="18" rx="2" ry="1" transform="rotate(-50 23 18)" fill="currentColor" />
      <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="900" fill="currentColor">1</text>
    </svg>
  );
}

type RowTier = "gold" | "podium" | "regular" | "me-below";

interface RowEntry {
  profile_id: string;
  rank: number;
  username: string;
  points: number;
  avatar_url: string | null;
}

function LeaderboardRow({ entry, isMe = false, tier, className = "" }: {
  entry: RowEntry;
  isMe?: boolean;
  tier: RowTier;
  className?: string;
}) {
  const tierStyles: Record<RowTier, string> = {
    gold: "py-5 bg-primary/[0.08] -mx-2 px-2 rounded-2xl",
    podium: "py-4",
    regular: "py-3",
    "me-below": "py-3 bg-primary/[0.05] -mx-2 px-2 rounded-2xl",
  };
  const avatarCls = (tier === "gold" || tier === "podium") ? "h-12 w-12" : "h-10 w-10";
  const ptsCls = tier === "gold" ? "text-xl" : "text-lg";
  const nameCls = tier === "gold" ? "text-base md:text-lg" : "text-sm md:text-base";

  return (
    <li className={`flex items-center gap-4 border-b border-container-border/40 last:border-0 ${tierStyles[tier]} ${className}`}>
      <div className="w-10 flex items-center justify-center shrink-0">
        {tier === "gold"
          ? <LaurelIcon className="h-9 w-9 text-primary" />
          : <span className={`font-anton text-xl tabular-nums ${tier === "regular" ? "text-secondary/50" : "text-secondary"}`}>
              {String(entry.rank).padStart(2, "0")}
            </span>}
      </div>
      <div className={`${avatarCls} shrink-0 rounded-full overflow-hidden bg-secondary`}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
          : <UserCircleIcon className="h-full w-full text-white/70" />}
      </div>
      <span className={`flex-1 min-w-0 truncate font-lato font-bold ${nameCls} text-text`}>
        {isMe ? "You" : `@${entry.username}`}
        {isMe && tier !== "me-below" && (
          <span className="ml-2 inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
            YOU
          </span>
        )}
      </span>
      <span className={`font-anton ${ptsCls} text-secondary tabular-nums shrink-0`}>
        {entry.points.toLocaleString()}
      </span>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="h-28 rounded-3xl skeleton-shimmer" />
      <div className="rounded-3xl bg-white border border-container-border p-6 md:p-8">
        <div className="h-8 w-28 rounded skeleton-shimmer mb-6" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 border-b border-container-border/40 fade-in-up stagger-${Math.min(i + 1, 6)}`}>
            <div className="w-10 h-8 rounded skeleton-shimmer shrink-0" />
            <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 h-4 rounded skeleton-shimmer" />
            <div className="w-20 h-4 rounded skeleton-shimmer shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Ranking() {
  const { leaderboard, myRank, loading, error } = useLeaderboard();
  const { user } = useProfile();

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        <header className="fade-in-up stagger-1">
          <h1 className="font-anton text-4xl md:text-5xl text-secondary leading-tight">Leaderboard</h1>
          <p className="mt-2 font-lato text-base text-text-light">Top fans of the season.</p>
        </header>

        {loading && <Skeleton />}

        {error && !loading && (
          <div className="mt-8">
            <EmptyState message="Standings are stuck." cta={{ label: "Try again", onClick: () => window.location.reload() }} />
          </div>
        )}

        {!loading && !error && (
          <>
            {myRank && (
              <section className="mt-6 rounded-3xl bg-white border border-container-border p-6 md:p-8 fade-in-up stagger-2">
                <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light mb-4">Your Standing</p>
                <div className="flex items-center gap-4">
                  <span className="font-anton text-3xl md:text-4xl text-secondary tabular-nums shrink-0">
                    #{myRank.rank}
                  </span>
                  <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-secondary">
                    {myRank.avatar_url
                      ? <img src={myRank.avatar_url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      : <UserCircleIcon className="h-full w-full text-white/70" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-lato font-bold text-secondary truncate">
                      @{user?.username ?? "you"}
                    </p>
                    <p className="font-lato text-sm text-text-light">
                      {myRank.streak} day streak · {myRank.pointsToFirst.toLocaleString()} pts to #1
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-anton text-2xl text-primary tabular-nums">
                      {myRank.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-8 rounded-3xl bg-white border border-container-border p-6 md:p-8 fade-in-up stagger-3">
              <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight mb-6">Top Fans</h2>
              {leaderboard.length === 0
                ? <EmptyState message="Tip-off hasn't happened. Be the first on the board." variant="compact" />
                : (
                  <ol className="flex flex-col">
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <LeaderboardRow
                        key={entry.profile_id}
                        entry={entry}
                        isMe={entry.profile_id === myRank?.profile_id}
                        tier={i === 0 ? "gold" : i < 3 ? "podium" : "regular"}
                        className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}
                      />
                    ))}
                    {myRank && myRank.rank > 10 && (
                      <>
                        <li className="border-t-2 border-container-border my-2" aria-hidden />
                        <LeaderboardRow
                          entry={{
                            profile_id: myRank.profile_id,
                            rank: myRank.rank,
                            username: user?.username ?? "you",
                            points: myRank.points,
                            avatar_url: myRank.avatar_url,
                          }}
                          isMe
                          tier="me-below"
                        />
                      </>
                    )}
                  </ol>
                )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
