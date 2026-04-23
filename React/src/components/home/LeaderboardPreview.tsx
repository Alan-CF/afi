import { useNavigate } from "react-router-dom";
import { TrophyIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Button from "../ui/Button";
import { useLeaderboardPreview } from "../../hooks/useLeaderboardPreview";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { top, me, loading, error } = useLeaderboardPreview(3);

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="flex h-full flex-col gap-3 rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">Top fans</p>
          <h2 id="leaderboard-title" className="font-anton text-2xl text-secondary">Leaderboard</h2>
        </div>
        <TrophyIcon className="h-8 w-8 text-primary" />
      </header>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="font-lato text-sm text-destructive">Could not load leaderboard.</p>
      )}

      {!loading && !error && (
        <ul className="flex flex-col gap-2">
          {top.map((entry) => (
            <li key={entry.profileId} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2">
              <span className="w-8 text-center font-anton text-lg">
                {MEDALS[entry.rank] ?? `#${entry.rank}`}
              </span>
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-text-light" />
              )}
              <span className="flex-1 truncate font-lato text-sm font-bold">@{entry.username}</span>
              <span className="font-lato text-sm text-text-light">{entry.points.toLocaleString()}</span>
            </li>
          ))}
          {me && !top.some((t) => t.profileId === me.profileId) && (
            <li className="mt-1 flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/10 px-3 py-2">
              <span className="w-8 text-center font-anton text-sm">#{me.rank}</span>
              {me.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-text-light" />
              )}
              <span className="flex-1 truncate font-lato text-sm font-bold">You</span>
              <span className="font-lato text-sm text-text-light">{me.points.toLocaleString()}</span>
            </li>
          )}
        </ul>
      )}

      <Button variant="secondary" className="mt-auto" onClick={() => navigate("/ranking")}>
        See full leaderboard
      </Button>
    </section>
  );
}
