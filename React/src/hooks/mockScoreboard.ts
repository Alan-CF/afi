import { useSyncExternalStore } from "react";

export type ScoreboardPhase = "pre" | "live" | "halftime" | "final";

export type ScoreboardState =
  | { phase: "pre";      opponent: string; label: string; countdown: string }
  | { phase: "live";     opponent: string; period: string;  warriorsScore: number; opponentScore: number }
  | { phase: "halftime"; opponent: string;                  warriorsScore: number; opponentScore: number }
  | { phase: "final";    opponent: string; won: boolean;    warriorsScore: number; opponentScore: number };

const CYCLE: ScoreboardState[] = [
  { phase: "pre",      opponent: "Memphis Grizzlies", label: "Tonight · 7:30 PM PT", countdown: "2h 15m" },
  { phase: "pre",      opponent: "Memphis Grizzlies", label: "Tonight · 7:30 PM PT", countdown: "12m" },
  { phase: "live",     opponent: "Memphis Grizzlies", period: "Q1 · 8:42",  warriorsScore: 18,  opponentScore: 14  },
  { phase: "live",     opponent: "Memphis Grizzlies", period: "Q2 · 3:11",  warriorsScore: 54,  opponentScore: 48  },
  { phase: "halftime", opponent: "Memphis Grizzlies",                        warriorsScore: 61,  opponentScore: 57  },
  { phase: "live",     opponent: "Memphis Grizzlies", period: "Q3 · 5:22",  warriorsScore: 89,  opponentScore: 85  },
  { phase: "live",     opponent: "Memphis Grizzlies", period: "Q4 · 1:38",  warriorsScore: 112, opponentScore: 108 },
  { phase: "final",    opponent: "Memphis Grizzlies", won: true,             warriorsScore: 118, opponentScore: 112 },
];

function getState(): ScoreboardState {
  return CYCLE[new Date().getMinutes() % CYCLE.length];
}

let _cached = getState();
const _listeners = new Set<() => void>();

const _tick = setInterval(() => {
  const next = getState();
  if (next !== _cached) {
    _cached = next;
    _listeners.forEach((l) => l());
  }
}, 10_000);

if (import.meta.hot) import.meta.hot.dispose(() => clearInterval(_tick));

export function useMockScoreboard(): ScoreboardState {
  return useSyncExternalStore(
    (cb) => { _listeners.add(cb); return () => _listeners.delete(cb); },
    getState,
    getState,
  );
}
