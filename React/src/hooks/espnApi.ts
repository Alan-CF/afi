/**
 * ESPN's public NBA endpoints. Unauthenticated, undocumented, no SLA.
 * Read-only. Falls back gracefully — if ESPN is down the events feed
 * just shows fan events only.
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
export const WARRIORS_ABBR = "GS";

export type GameState = "pre" | "in" | "post";

export interface WarriorsGame {
  eventId: string;
  startAt: string;
  opponentAbbr: string;
  opponentName: string;
  opponentLogo: string;
  warriorsLogo: string;
  isHome: boolean;
  venue: string | null;
  broadcast: string | null;
  state: GameState;
  warriorsScore?: number;
  opponentScore?: number;
  clock?: string;
  period?: number;
  statusDetail?: string;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  score: string;
  team: { abbreviation: string; displayName: string; logo: string };
}
interface EspnEvent {
  id: string;
  date: string;
  competitions: Array<{
    venue?: { fullName: string };
    broadcasts?: Array<{ names: string[] }>;
    competitors: EspnCompetitor[];
    status: {
      displayClock?: string;
      period?: number;
      type: { state: GameState; detail: string };
    };
  }>;
}

function extractWarriorsGame(ev: EspnEvent): WarriorsGame | null {
  const comp = ev.competitions[0];
  if (!comp) return null;

  const warriors = comp.competitors.find((c) => c.team.abbreviation === WARRIORS_ABBR);
  const opponent = comp.competitors.find((c) => c.team.abbreviation !== WARRIORS_ABBR);
  if (!warriors || !opponent) return null;

  return {
    eventId: ev.id,
    startAt: ev.date,
    opponentAbbr: opponent.team.abbreviation,
    opponentName: opponent.team.displayName,
    opponentLogo: opponent.team.logo,
    warriorsLogo: warriors.team.logo,
    isHome: warriors.homeAway === "home",
    venue: comp.venue?.fullName ?? null,
    broadcast: comp.broadcasts?.[0]?.names?.join(" / ") ?? null,
    state: comp.status.type.state,
    warriorsScore: warriors.score ? Number(warriors.score) : undefined,
    opponentScore: opponent.score ? Number(opponent.score) : undefined,
    clock: comp.status.displayClock,
    period: comp.status.period,
    statusDetail: comp.status.type.detail,
  };
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) { console.warn(`ESPN ${res.status} for ${url}`); return null; }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name !== "AbortError") console.warn("ESPN fetch error:", err);
    return null;
  }
}

/** Warriors games in the next `days` days, ascending. Includes in-progress (up to 4h old). */
export async function fetchUpcomingWarriorsGames(
  days = 14,
  signal?: AbortSignal
): Promise<WarriorsGame[]> {
  const data = await fetchJson<{ events: EspnEvent[] }>(
    `${ESPN_BASE}/teams/gs/schedule`,
    signal
  );
  if (!data?.events) return [];

  const horizon = Date.now() + days * 24 * 60 * 60 * 1000;

  return data.events
    .map(extractWarriorsGame)
    .filter((g): g is WarriorsGame => g !== null)
    .filter((g) => {
      const t = new Date(g.startAt).getTime();
      return t >= Date.now() - 4 * 60 * 60 * 1000 && t <= horizon;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export async function fetchLiveWarriorsGame(
  signal?: AbortSignal
): Promise<WarriorsGame | null> {
  const data = await fetchJson<{ events: EspnEvent[] }>(
    `${ESPN_BASE}/scoreboard`,
    signal
  );
  if (!data?.events) return null;

  for (const ev of data.events) {
    const game = extractWarriorsGame(ev);
    if (game && game.state === "in") return game;
  }
  return null;
}
