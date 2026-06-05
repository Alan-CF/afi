import type { UnifiedEvent } from "../hooks/events";
import { listSeedFanEventDetails } from "./seedFanEventDetails";

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";

const TEAM_LOGOS: Record<string, { abbr: string; name: string; logo: string }> = {
  LAL: { abbr: "LAL", name: "Los Angeles Lakers", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
  PHX: { abbr: "PHX", name: "Phoenix Suns", logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png" },
  DEN: { abbr: "DEN", name: "Denver Nuggets", logo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png" },
  DAL: { abbr: "DAL", name: "Dallas Mavericks", logo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png" },
  BOS: { abbr: "BOS", name: "Boston Celtics", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png" },
  OKC: { abbr: "OKC", name: "Oklahoma City Thunder", logo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png" },
};

function daysFromNow(days: number, hour = 19, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildGame(
  id: string,
  abbr: keyof typeof TEAM_LOGOS,
  daysAhead: number,
  isHome: boolean,
  venue: string,
  city: string,
  broadcast: string,
): UnifiedEvent {
  const team = TEAM_LOGOS[abbr];
  return {
    id,
    type: "game",
    title: isHome ? `Warriors vs ${team.abbr}` : `Warriors @ ${team.abbr}`,
    subtitle: team.name,
    startAt: daysFromNow(daysAhead),
    venue,
    imageUrl: null,
    meta: {
      isHome,
      isLive: false,
      isFinal: false,
      warriorsScore: null,
      opponentScore: null,
      status: "pre",
      warriorsLogo: WARRIORS_LOGO,
      opponentLogo: team.logo,
      opponentAbbr: team.abbr,
      opponentName: team.name,
      broadcast,
      city,
    },
  };
}

export const SEED_GAMES: UnifiedEvent[] = [
  buildGame("seed-game-lal", "LAL", 2, true, "Chase Center", "San Francisco, CA", "ESPN"),
  buildGame("seed-game-phx", "PHX", 5, false, "Footprint Center", "Phoenix, AZ", "TNT"),
  buildGame("seed-game-den", "DEN", 9, true, "Chase Center", "San Francisco, CA", "NBC Sports Bay Area"),
  buildGame("seed-game-dal", "DAL", 13, false, "American Airlines Center", "Dallas, TX", "ESPN"),
  buildGame("seed-game-bos", "BOS", 18, true, "Chase Center", "San Francisco, CA", "ABC"),
  buildGame("seed-game-okc", "OKC", 24, false, "Paycom Center", "Oklahoma City, OK", "TNT"),
];

export const SEED_FAN_EVENTS: UnifiedEvent[] = listSeedFanEventDetails().map(
  (seed) => ({
    id: seed.id,
    type: "fan",
    title: seed.title,
    subtitle: [seed.venue, seed.city].filter(Boolean).join(", "),
    startAt: seed.startAt,
    venue: seed.venue,
    imageUrl: seed.coverImageUrl,
    tags: seed.tags,
    meta: {
      goingCount: seed.attendees.length,
    },
  })
);

export const SEED_EVENTS: UnifiedEvent[] = [...SEED_GAMES, ...SEED_FAN_EVENTS];
