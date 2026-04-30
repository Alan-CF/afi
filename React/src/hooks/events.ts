import { fetchUpcomingFanEvents, type FanEvent } from "./fanEvents";
import { fetchUpcomingWarriorsGames, type WarriorsGame } from "./espnApi";
import { SEED_EVENTS } from "../lib/seedEvents";

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
    isFinal?: boolean;
    warriorsScore?: number | null;
    opponentScore?: number | null;
    status?: string;
    statusDetail?: string;
    period?: number;
    clock?: string;
    warriorsLogo?: string;
    opponentLogo?: string;
    opponentAbbr?: string;
    opponentName?: string;
    broadcast?: string | null;
    goingCount?: number;
    fanEventId?: number;
  };
}

function espnGameToUnified(g: WarriorsGame): UnifiedEvent {
  const isLive = g.state === "in";
  const isFinal = g.state === "post";

  const warriorsScore = Number.isFinite(g.warriorsScore) ? (g.warriorsScore as number) : null;
  const opponentScore = Number.isFinite(g.opponentScore) ? (g.opponentScore as number) : null;

  return {
    id: `game-${g.eventId}`,
    type: "game",
    title: g.isHome ? `Warriors vs ${g.opponentAbbr}` : `Warriors @ ${g.opponentAbbr}`,
    subtitle: g.opponentName,
    startAt: g.startAt,
    venue: g.venue,
    imageUrl: null,
    meta: {
      isHome: g.isHome,
      isLive,
      isFinal,
      warriorsScore,
      opponentScore,
      status: g.state,
      statusDetail: g.statusDetail,
      period: g.period,
      clock: g.clock,
      warriorsLogo: g.warriorsLogo,
      opponentLogo: g.opponentLogo,
      opponentAbbr: g.opponentAbbr,
      opponentName: g.opponentName,
      broadcast: g.broadcast,
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
  includeSeed?: boolean;
}

export async function fetchUpcomingEvents(
  options: FetchEventsOptions = {}
): Promise<UnifiedEvent[]> {
  const limit = options.limit ?? 4;
  const types = options.types ?? ["game", "fan"];
  const includeSeed = options.includeSeed ?? true;

  const [games, fanEvents] = await Promise.all([
    types.includes("game")
      ? fetchUpcomingWarriorsGames(30, options.signal).catch(() => [])
      : Promise.resolve([] as WarriorsGame[]),
    types.includes("fan")
      ? fetchUpcomingFanEvents(20).catch(() => [])
      : Promise.resolve([] as FanEvent[]),
  ]);

  const live: UnifiedEvent[] = [
    ...games.map(espnGameToUnified),
    ...fanEvents.map(fanEventToUnified),
  ];

  const seen = new Set(
    live.map((e) => `${e.type}-${e.title}-${e.startAt.slice(0, 10)}`)
  );

  const seed = includeSeed
    ? SEED_EVENTS.filter(
        (e) =>
          types.includes(e.type) &&
          !seen.has(`${e.type}-${e.title}-${e.startAt.slice(0, 10)}`)
      )
    : [];

  const combined: UnifiedEvent[] = [...live, ...seed];

  const HOUR = 60 * 60 * 1000;
  const future = combined.filter((e) => {
    if (e.meta.isLive) return true;
    return new Date(e.startAt).getTime() > Date.now() - HOUR;
  });

  future.sort((a, b) => {
    if (a.meta.isLive && !b.meta.isLive) return -1;
    if (!a.meta.isLive && b.meta.isLive) return 1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return future.slice(0, limit);
}
