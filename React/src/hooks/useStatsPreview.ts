import { useEffect, useState } from "react";
import {
  fetchStandings,
  fetchWarriorsGames,
  fetchWarriorsPlayers,
} from "../lib/statisticsApi";
import { SEED_GAMES } from "../lib/seedEvents";

export interface StatsPreviewLastGame {
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  won: boolean;
  warriorsScore: number;
  opponentScore: number;
}

export interface StatsPreviewNextGame {
  opponentAbbr: string;
  opponentName: string;
  isHome: boolean;
  startAt: string;
}

export interface StatsPreview {
  record: { wins: number; losses: number } | null;
  lastGame: StatsPreviewLastGame | null;
  nextGame: StatsPreviewNextGame | null;
  topScorer: { name: string; ppg: string } | null;
}

function deriveNextGame(): StatsPreviewNextGame | null {
  const now = Date.now();
  const upcoming = SEED_GAMES
    .map((g) => ({ event: g, time: new Date(g.startAt).getTime() }))
    .filter(({ time }) => time > now)
    .sort((a, b) => a.time - b.time)[0];
  if (!upcoming) return null;
  const m = upcoming.event.meta;
  return {
    opponentAbbr: m.opponentAbbr ?? "?",
    opponentName: m.opponentName ?? "Opponent",
    isHome: m.isHome ?? true,
    startAt: upcoming.event.startAt,
  };
}

export function useStatsPreview() {
  const [data, setData] = useState<StatsPreview>({
    record: null,
    lastGame: null,
    nextGame: deriveNextGame(),
    topScorer: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [standings, games, players] = await Promise.all([
          fetchStandings().catch(() => []),
          fetchWarriorsGames().catch(() => []),
          fetchWarriorsPlayers().catch(() => []),
        ]);

        if (cancelled) return;

        const warriors = standings.find((s) => s.team.includes("Warriors")) ?? null;
        const record = warriors ? { wins: warriors.wins, losses: warriors.losses } : null;

        const last = games.find(
          (g) => g.status === "final" && g.warriors_score != null && g.opponent_score != null
        ) ?? null;

        const lastGame: StatsPreviewLastGame | null = last
          ? {
              opponent: last.opponent,
              opponentAbbr: (last.opponent.split(" ").pop() ?? last.opponent).toUpperCase(),
              isHome: last.is_home,
              won: (last.warriors_score ?? 0) > (last.opponent_score ?? 0),
              warriorsScore: last.warriors_score ?? 0,
              opponentScore: last.opponent_score ?? 0,
            }
          : null;

        const sorted = players
          .filter((p) => p.pts !== "—" && !Number.isNaN(parseFloat(p.pts)))
          .sort((a, b) => parseFloat(b.pts) - parseFloat(a.pts));

        const topScorer = sorted[0]
          ? { name: sorted[0].name, ppg: sorted[0].pts }
          : null;

        setData({ record, lastGame, nextGame: deriveNextGame(), topScorer });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading };
}
