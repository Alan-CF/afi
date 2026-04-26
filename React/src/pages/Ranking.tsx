import { UserCircleIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useLeaderboard } from "../hooks/useRanking";
import { useProfile } from "../hooks/useProfile";
import EmptyState from "../components/common/EmptyState";
import LeaderboardPodium, { type PodiumEntry } from "../components/common/LeaderboardPodium";

interface RowEntry {
  profile_id: string;
  rank: number;
  username: string;
  points: number;
  avatar_url: string | null;
}

function ListRow({ entry, isMe = false }: { entry: RowEntry; isMe?: boolean }) {
  return (
    <li
      className={`flex items-center gap-4 py-3 md:py-4 border-b border-container-border/40 last:border-0 ${isMe ? "bg-primary/[0.06] -mx-2 px-2 rounded-xl" : ""}`}
    >
      <span className="font-anton text-lg tabular-nums w-10 text-right shrink-0 text-secondary/60">
        {String(entry.rank).padStart(2, "0")}
      </span>
      <div className="h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-full overflow-hidden bg-secondary">
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <UserCircleIcon className="h-full w-full text-white/70" />
        )}
      </div>
      <span className="flex-1 min-w-0 truncate font-lato font-bold text-sm md:text-base text-text">
        {isMe ? "You" : `@${entry.username}`}
        {isMe && (
          <span className="ml-2 inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
            YOU
          </span>
        )}
      </span>
      <span className="font-anton text-base md:text-lg tabular-nums shrink-0 text-secondary">
        {entry.points.toLocaleString()}
      </span>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="h-28 rounded-3xl skeleton-shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white border border-container-border p-6 md:p-8">
          <div className="grid grid-cols-3 items-end gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full skeleton-shimmer" />
                <div className="h-3 w-16 rounded skeleton-shimmer" />
                <div className={`${i === 1 ? "h-24" : i === 0 ? "h-16" : "h-12"} w-full rounded-t-2xl skeleton-shimmer`} />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7 rounded-3xl bg-white border border-container-border p-6 md:p-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-container-border/40">
              <div className="w-10 h-5 rounded skeleton-shimmer" />
              <div className="h-10 w-10 rounded-full skeleton-shimmer" />
              <div className="flex-1 h-4 rounded skeleton-shimmer" />
              <div className="w-20 h-4 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const { leaderboard, myRank, loading, error } = useLeaderboard();
  const { user } = useProfile();

  const top3: PodiumEntry[] = leaderboard.slice(0, 3).map((e) => ({
    profile_id: e.profile_id,
    rank: e.rank,
    username: e.username,
    points: e.points,
    avatar_url: e.avatar_url,
  }));

  const list: RowEntry[] = leaderboard.slice(3, 10).map((e) => ({
    profile_id: e.profile_id,
    rank: e.rank,
    username: e.username,
    points: e.points,
    avatar_url: e.avatar_url,
  }));

  const meInTop = !!myRank && leaderboard.some((e) => e.profile_id === myRank.profile_id);

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
                    {myRank.avatar_url ? (
                      <img
                        src={myRank.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-white/70" />
                    )}
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

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in-up stagger-3">
              <section className="lg:col-span-5 rounded-3xl bg-white border border-container-border p-6 md:p-8">
                <h2 className="font-anton text-2xl md:text-3xl text-secondary leading-tight mb-6">
                  Podium
                </h2>
                {top3.length === 0 ? (
                  <EmptyState message="No fans on the board yet." variant="compact" />
                ) : (
                  <LeaderboardPodium top3={top3} meId={myRank?.profile_id ?? null} size="full" />
                )}
              </section>

              <section className="lg:col-span-7 rounded-3xl bg-white border border-container-border p-6 md:p-8">
                <h2 className="font-anton text-2xl md:text-3xl text-secondary leading-tight mb-4">
                  Top Fans
                </h2>
                {list.length === 0 && !meInTop ? (
                  <EmptyState message="Standings open after the first challenge." variant="compact" />
                ) : (
                  <ol className="flex flex-col max-h-[520px] lg:max-h-[420px] overflow-y-auto pr-1 -mr-1">
                    {list.map((entry) => (
                      <ListRow
                        key={entry.profile_id}
                        entry={entry}
                        isMe={entry.profile_id === myRank?.profile_id}
                      />
                    ))}
                    {myRank && !meInTop && (
                      <>
                        <li className="my-2 border-t-2 border-container-border" aria-hidden />
                        <ListRow
                          entry={{
                            profile_id: myRank.profile_id,
                            rank: myRank.rank,
                            username: user?.username ?? "you",
                            points: myRank.points,
                            avatar_url: myRank.avatar_url,
                          }}
                          isMe
                        />
                      </>
                    )}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
