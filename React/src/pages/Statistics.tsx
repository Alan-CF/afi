import { useState, useEffect } from "react";
import NavBar from "../components/layout/NavBar";
import { CalendarIcon, UserGroupIcon, TrophyIcon } from "@heroicons/react/24/solid";
import {
  fetchWarriorsPlayers,
  fetchWarriorsGames,
  fetchStandings,
  type PlayerStat,
  type Game,
  type Standing,
} from "../lib/statisticsApi";

type Tab = "roster" | "games" | "standings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "roster", label: "Roster", icon: <UserGroupIcon className="h-4 w-4" /> },
  { id: "games", label: "Games", icon: <CalendarIcon className="h-4 w-4" /> },
  { id: "standings", label: "Standings", icon: <TrophyIcon className="h-4 w-4" /> },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center py-3">
      <p className="text-lg font-extrabold text-secondary">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerStat }) {
  return (
    <div className="rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)] overflow-hidden">
      <div className="bg-secondary px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-extrabold text-lg leading-tight">{player.name}</p>
          <p className="text-white/60 text-xs mt-1 uppercase tracking-wide">
            {player.position} · {player.gp} GP
          </p>
        </div>
        <span className="text-4xl font-extrabold text-[var(--color-primary)]/30">
          #{player.jersey_number}
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--color-container-border)]">
        {[
          { label: "PTS", value: player.pts },
          { label: "REB", value: player.reb },
          { label: "AST", value: player.ast },
        ].map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const isFinished = game.status === "Final";
  const won = isFinished && (game.warriors_score ?? 0) > (game.opponent_score ?? 0);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-container-border)] shadow-sm p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
        !isFinished ? "bg-gray-100 text-gray-400" :
        won ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
      }`}>
        {!isFinished ? "—" : won ? "W" : "L"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-secondary">
          {game.is_home ? "vs" : "@"} {game.opponent}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(game.date).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </p>
      </div>
      {isFinished ? (
        <p className={`text-base font-extrabold ${won ? "text-green-600" : "text-red-500"}`}>
          {game.warriors_score} – {game.opponent_score}
        </p>
      ) : (
        <p className="text-xs font-semibold text-gray-400">{game.status}</p>
      )}
    </div>
  );
}

function StandingRow({ standing, rank }: { standing: Standing; rank: number }) {
  const isWarriors = standing.team === "Golden State Warriors";

  return (
    <div className={`flex items-center gap-3 rounded-xl border shadow-sm p-3 ${
      isWarriors
        ? "bg-secondary border-secondary"
        : "bg-[var(--color-background)] border-[var(--color-container-border)]"
    }`}>
      <span className={`text-sm font-extrabold w-6 text-center ${
        isWarriors ? "text-[var(--color-primary)]" : "text-gray-400"
      }`}>
        {rank}
      </span>
      <div className="flex-1">
        <p className={`font-bold text-sm ${isWarriors ? "text-white" : "text-secondary"}`}>
          {standing.team}
        </p>
        <p className={`text-xs ${isWarriors ? "text-white/60" : "text-gray-400"}`}>
          {standing.division}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-extrabold ${isWarriors ? "text-white" : "text-secondary"}`}>
          {standing.wins}W
        </span>
        <span className={`text-sm ${isWarriors ? "text-white/40" : "text-gray-300"}`}>–</span>
        <span className={`text-sm font-extrabold ${isWarriors ? "text-white/70" : "text-gray-400"}`}>
          {standing.losses}L
        </span>
      </div>
    </div>
  );
}

export default function Statistics() {
  const [activeTab, setActiveTab] = useState<Tab>("roster");
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [playersData, gamesData, standingsData] = await Promise.all([
          fetchWarriorsPlayers(),
          fetchWarriorsGames(),
          fetchStandings(),
        ]);
        setPlayers(playersData);
        setGames(gamesData);
        setStandings(standingsData);
      } catch (e) {
        console.error(e);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-12">

        {/* HEADER */}
        <section className="rounded-2xl bg-secondary overflow-hidden mb-5">
          <div className="flex flex-col md:flex-row items-center gap-6 px-8 py-8">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"
              alt="Warriors"
              className="h-24 w-24 object-contain"
            />
            <div className="text-center md:text-left">
              <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">
                NBA · Western Conference
              </p>
              <h1 className="text-4xl font-extrabold text-white">Golden State Warriors</h1>
              <p className="text-[var(--color-primary)] font-bold mt-1">
                Chase Center · San Francisco, CA
              </p>
            </div>
          </div>

          <div className="flex border-t border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--color-primary)] text-secondary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-5 text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {/* ROSTER */}
        {!loading && activeTab === "roster" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.length > 0
              ? players.map((player, i) => <PlayerCard key={i} player={player} />)
              : <p className="col-span-full text-center text-gray-400 py-10">No players found.</p>
            }
          </div>
        )}

        {/* GAMES */}
        {!loading && activeTab === "games" && (
          <section className="rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)] p-4">
            <div className="space-y-3">
              {games.length > 0
                ? games.map((game, i) => <GameRow key={i} game={game} />)
                : <p className="text-center text-gray-400 py-10">No games found.</p>
              }
            </div>
          </section>
        )}

        {/* STANDINGS */}
        {!loading && activeTab === "standings" && (
          <section className="rounded-2xl border border-[var(--color-container-border)] bg-[var(--color-text-light-soft)] p-4">
            <div className="space-y-2">
              {standings
                .filter((s) => s.conf === "West")
                .map((s, i) => <StandingRow key={i} standing={s} rank={i + 1} />)
              }
            </div>
          </section>
        )}

      </main>
    </div>
  );
}