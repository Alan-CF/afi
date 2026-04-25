import { fetchUpcomingFanEvents, type FanEvent } from "./fanEvents";
import { fetchUpcomingGamesFromStats, type Game } from "../lib/statisticsApi";

export type EventType = "game" | "fan";

export interface UnifiedEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle: string | null;
  startAt: string;
  venue: string | null;
  imageUrl: string | null;
  meta: {
    isHome?: boolean;
    isLive?: boolean;
    warriorsScore?: number | null;
    opponentScore?: number | null;
    status?: string;
    goingCount?: number;
    fanEventId?: number;
  };
}

function gameToUnified(g: Game): UnifiedEvent {
  const abbr = g.opponent.split(" ").pop() ?? g.opponent;
  const isLive = g.status === "live" || g.status === "in_progress";

  return {
    id: `game-${g.date}-${g.opponent.replace(/\s/g, "")}`,
    type: "game",
    title: g.is_home ? `Warriors vs ${abbr}` : `Warriors @ ${abbr}`,
    subtitle: g.opponent,
    startAt: g.date,
    venue: null,
    imageUrl: null,
    meta: {
      isHome: g.is_home,
      isLive,
      warriorsScore: g.warriors_score,
      opponentScore: g.opponent_score,
      status: g.status,
    },
  };
}

function fanEventToUnified(f: FanEvent): UnifiedEvent {
  return {
    id: `fan-${f.id}`,
    type: "fan",
    title: f.title,
    subtitle: [f.venue, f.city].filter(Boolean).join(", ") || null,
    startAt: f.startAt,
    venue: f.venue,
    imageUrl: f.imageUrl,
    meta: { goingCount: f.goingCount, fanEventId: f.id },
  };
}

export interface FetchEventsOptions {
  limit?: number;
  signal?: AbortSignal;
  types?: EventType[];
}

export async function fetchUpcomingEvents(
  options: FetchEventsOptions = {}
): Promise<UnifiedEvent[]> {
  const limit = options.limit ?? 4;
  const types = options.types ?? ["game", "fan"];

  const [games, fanEvents] = await Promise.all([
    types.includes("game") ? fetchUpcomingGamesFromStats() : Promise.resolve([]),
    types.includes("fan")  ? fetchUpcomingFanEvents(20)   : Promise.resolve([]),
  ]);

  const combined = [
    ...games.map(gameToUnified),
    ...fanEvents.map(fanEventToUnified),
  ];

  combined.sort((a, b) => {
    if (a.meta.isLive && !b.meta.isLive) return -1;
    if (!a.meta.isLive && b.meta.isLive) return 1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return combined.slice(0, limit);
}
