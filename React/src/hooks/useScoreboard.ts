import { useEffect, useRef, useState } from "react";
import {
  fetchLiveWarriorsGame,
  fetchUpcomingWarriorsGames,
  type WarriorsGame,
} from "./espnApi";

export type ScoreboardState =
  | { kind: "hidden" }
  | { kind: "live";  game: WarriorsGame }
  | { kind: "pre";   game: WarriorsGame; tipoffMs: number }
  | { kind: "final"; game: WarriorsGame; won: boolean };

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

async function resolveState(signal: AbortSignal): Promise<ScoreboardState> {
  const live = await fetchLiveWarriorsGame(signal);
  if (live) return { kind: "live", game: live };

  const upcoming = await fetchUpcomingWarriorsGames(2, signal);
  const now = Date.now();

  const next = upcoming.find((g) => {
    const t = new Date(g.startAt).getTime();
    return t > now && t - now <= TWENTY_FOUR_H;
  });
  if (next) {
    return {
      kind: "pre",
      game: next,
      tipoffMs: new Date(next.startAt).getTime() - now,
    };
  }

  const recent = upcoming
    .filter((g) => g.state === "post")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

  if (recent && now - new Date(recent.startAt).getTime() <= TWENTY_FOUR_H) {
    const won =
      typeof recent.warriorsScore === "number" &&
      typeof recent.opponentScore === "number" &&
      recent.warriorsScore > recent.opponentScore;
    return { kind: "final", game: recent, won };
  }

  return { kind: "hidden" };
}

export function useScoreboard(pollMs = 60_000) {
  const [state, setState] = useState<ScoreboardState>({ kind: "hidden" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const next = await resolveState(controller.signal);
        if (!cancelled && !controller.signal.aborted) setState(next);
      } catch {
        if (!cancelled) setState({ kind: "hidden" });
      }
    }

    void load();
    const interval = window.setInterval(load, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [pollMs]);

  return state;
}
