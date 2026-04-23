import { fetchUpcomingWarriorsGames, fetchLiveWarriorsGame, type WarriorsGame } from "./espnApi";
import { fetchUpcomingFanEvents, type FanEvent } from "./fanEvents";

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
    opponentAbbr?: string;
    opponentLogo?: string;
    warriorsLogo?: string;
    isHome?: boolean;
    broadcast?: string | null;
    isLive?: boolean;
    warriorsScore?: number;
    opponentScore?: number;
    clock?: string;
    period?: number;
    goingCount?: number;
    fanEventId?: number;
  };
}

function gameToUnified(g: WarriorsGame, isLive: boolean): UnifiedEvent {
  return {
    id: `game-${g.eventId}`,
    type: "game",
    title: g.isHome ? `Warriors vs ${g.opponentAbbr}` : `Warriors @ ${g.opponentAbbr}`,
    subtitle: g.opponentName,
    startAt: g.startAt,
    venue: g.venue,
    imageUrl: null,
    meta: {
      opponentAbbr: g.opponentAbbr,
      opponentLogo: g.opponentLogo,
      warriorsLogo: g.warriorsLogo,
      isHome: g.isHome,
      broadcast: g.broadcast,
      isLive,
      warriorsScore: g.warriorsScore,
      opponentScore: g.opponentScore,
      clock: g.clock,
      period: g.period,
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

  const [games, fanEvents, liveGame] = await Promise.all([
    types.includes("game") ? fetchUpcomingWarriorsGames(30, options.signal) : Promise.resolve([]),
    types.includes("fan")  ? fetchUpcomingFanEvents(20)                     : Promise.resolve([]),
    types.includes("game") ? fetchLiveWarriorsGame(options.signal)          : Promise.resolve(null),
  ]);

  const combined = [
    ...games.map((g) => gameToUnified(g, liveGame?.eventId === g.eventId)),
    ...fanEvents.map(fanEventToUnified),
  ];

  combined.sort((a, b) => {
    if (a.meta.isLive && !b.meta.isLive) return -1;
    if (!a.meta.isLive && b.meta.isLive) return 1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return combined.slice(0, limit);
}
