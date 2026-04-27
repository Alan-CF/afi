import type { UnifiedEvent } from "../hooks/events";

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
    },
  };
}

export const SEED_GAMES: UnifiedEvent[] = [
  buildGame("seed-game-lal", "LAL", 2, true, "Chase Center", "ESPN"),
  buildGame("seed-game-phx", "PHX", 5, false, "Footprint Center", "TNT"),
  buildGame("seed-game-den", "DEN", 9, true, "Chase Center", "NBC Sports Bay Area"),
  buildGame("seed-game-dal", "DAL", 13, false, "American Airlines Center", "ESPN"),
  buildGame("seed-game-bos", "BOS", 18, true, "Chase Center", "ABC"),
  buildGame("seed-game-okc", "OKC", 24, false, "Paycom Center", "TNT"),
];

export const SEED_FAN_EVENTS: UnifiedEvent[] = [
  {
    id: "seed-fan-watch-mission",
    type: "fan",
    title: "Watch Party · Mission Bay",
    subtitle: "The Yard, San Francisco",
    startAt: daysFromNow(2, 18, 30),
    venue: "The Yard",
    imageUrl: "https://images.unsplash.com/photo-1518614368389-78fe05f76e6d?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 142 },
  },
  {
    id: "seed-fan-jersey-signing",
    type: "fan",
    title: "Legends Jersey Signing",
    subtitle: "Warriors Pop-up, Oakland",
    startAt: daysFromNow(7, 14, 0),
    venue: "Warriors Pop-up Store",
    imageUrl: "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 86 },
  },
  {
    id: "seed-fan-bay-bridge-run",
    type: "fan",
    title: "Bay Bridge Fan Run",
    subtitle: "Crissy Field, San Francisco",
    startAt: daysFromNow(11, 8, 0),
    venue: "Crissy Field",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 311 },
  },
  {
    id: "seed-fan-trivia-night",
    type: "fan",
    title: "Warriors Trivia Night",
    subtitle: "Bartlett Hall, San Francisco",
    startAt: daysFromNow(15, 20, 0),
    venue: "Bartlett Hall",
    imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 54 },
  },
  {
    id: "seed-fan-court-session",
    type: "fan",
    title: "Pickup at the Pier",
    subtitle: "Pier 70, San Francisco",
    startAt: daysFromNow(20, 17, 0),
    venue: "Pier 70 Courts",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 92 },
  },
  {
    id: "seed-fan-finals-watch",
    type: "fan",
    title: "Playoff Night CDMX",
    subtitle: "Reforma Sports Bar, Mexico City",
    startAt: daysFromNow(28, 19, 0),
    venue: "Reforma Sports Bar",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    meta: { goingCount: 178 },
  },
];

export const SEED_EVENTS: UnifiedEvent[] = [...SEED_GAMES, ...SEED_FAN_EVENTS];
