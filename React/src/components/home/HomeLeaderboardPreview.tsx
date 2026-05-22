import { Link } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useLeaderboard } from "../../hooks/useRanking";
import { useProfile } from "../../hooks/useProfile";

interface RailEntry {
  profile_id: string;
  rank: number;
  username: string;
  points: number;
  avatar_url: string | null;
  isMe: boolean;
}

function RankCard({ entry }: { entry: RailEntry }) {
  return (
    <div
      className={`group relative snap-start shrink-0 w-[140px] sm:w-[150px] flex flex-col items-center gap-2 rounded-2xl bg-white border border-container-border p-4 lift-on-hover ${entry.isMe ? "border-primary" : ""}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="font-anton text-sm tabular-nums text-primary">
          #{String(entry.rank).padStart(2, "0")}
        </span>
        {entry.isMe && (
          <span className="inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
            YOU
          </span>
        )}
      </div>
      <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-secondary">
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
      <p className="font-lato font-bold text-xs text-secondary text-center truncate w-full">
        @{entry.username}
      </p>
      <p className="font-anton text-base tabular-nums text-secondary/80">
        {entry.points.toLocaleString()}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="snap-start shrink-0 w-[140px] sm:w-[150px] flex flex-col items-center gap-2 rounded-2xl bg-white border border-container-border p-4">
      <div className="w-full h-4 rounded skeleton-shimmer" />
      <div className="h-14 w-14 rounded-full skeleton-shimmer" />
      <div className="w-20 h-3 rounded skeleton-shimmer" />
      <div className="w-16 h-4 rounded skeleton-shimmer" />
    </div>
  );
}

export default function HomeLeaderboardPreview() {
  const { leaderboard, myRank, loading, error } = useLeaderboard();
  const { user } = useProfile();

  const topNine = leaderboard.slice(0, 9);
  const meInTopNine = myRank ? topNine.some((e) => e.profile_id === myRank.profile_id) : false;

  const meCard: RailEntry | null =
    myRank && !meInTopNine
      ? {
          profile_id: myRank.profile_id,
          rank: myRank.rank,
          username: user?.username ?? "you",
          points: myRank.points,
          avatar_url: myRank.avatar_url,
          isMe: true,
        }
      : null;

  const cards: RailEntry[] = topNine.map((e) => ({
    profile_id: e.profile_id,
    rank: e.rank,
    username: e.username,
    points: e.points,
    avatar_url: e.avatar_url,
    isMe: myRank?.profile_id === e.profile_id,
  }));

  if (meCard) cards.push(meCard);

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <div>
          <Link
            to="/ranking"
            className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            Leaderboard
          </Link>
          <p className="font-lato text-sm text-text-light mt-1">
            Top fans of this month.
          </p>
        </div>
        <Link
          to="/ranking"
          className="font-lato text-sm font-bold text-text-light hover:text-secondary transition-colors shrink-0"
        >
          See all
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 md:scroll-pl-6 lg:scroll-pl-8 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="font-lato text-sm text-text-light">Couldn't load standings right now.</p>
      ) : cards.length === 0 ? (
        <p className="font-lato text-sm text-text-light">Tip-off hasn't happened. Be the first on the board.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-pl-4 md:scroll-pl-6 lg:scroll-pl-8 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
          {cards.map((entry) => (
            <RankCard key={entry.profile_id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
