import { listSeedHandlePool } from "./seedFanEventDetails";

export interface WarriorsGameAttendee {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface WarriorsGameDetail {
  id: string;
  matchup: string;
  isHome: boolean;
  opponentAbbr: string;
  opponentName: string;
  opponentLogo: string;
  warriorsLogo: string;
  startAt: string;
  endAt: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  broadcast: string;
  description: string;
  coverImageUrl: string;
  stadiumImageUrl: string;
  galleryImageUrls: string[];
  capacity: number;
  attendees: WarriorsGameAttendee[];
  goingCount: number;
  watchRoomCta: string;
}

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";

function daysFromNow(days: number, hour = 19, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pickAttendees(indices: number[]): WarriorsGameAttendee[] {
  const pool = listSeedHandlePool();
  const unique = Array.from(new Set(indices));
  return unique.map((index) => ({
    id: `poolgame-${index}`,
    username: pool[index],
    avatarUrl: null,
  }));
}

const GAME_DETAILS: WarriorsGameDetail[] = [
  {
    id: "seed-game-lal",
    matchup: "Warriors vs Lakers",
    isHome: true,
    opponentAbbr: "LAL",
    opponentName: "Los Angeles Lakers",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(2),
    endAt: daysFromNow(2, 22, 0),
    venue: "Chase Center",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.768,
    lng: -122.3877,
    broadcast: "ESPN",
    description:
      "Battle of California at Chase Center. Bay Area energy meets Hollywood for a marquee primetime matchup. Doors open 90 minutes before tip-off. Bring your gold towels.",
    coverImageUrl: "/court_warriors.png",
    stadiumImageUrl: "/playoffnight.png",
    galleryImageUrls: [
      "/court_warriors.png",
      "/warriors_icon.png",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518614368389-c0ce372a37b7?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 18064,
    attendees: pickAttendees([
      0, 1, 3, 5, 7, 11, 13, 14, 17, 19, 22, 24, 28, 30, 33, 38, 42, 46, 8, 12,
      20, 32, 40, 44,
    ]),
    goingCount: 0,
    watchRoomCta: "Reserve a room",
  },
  {
    id: "seed-game-phx",
    matchup: "Warriors @ Suns",
    isHome: false,
    opponentAbbr: "PHX",
    opponentName: "Phoenix Suns",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(5),
    endAt: daysFromNow(5, 22, 30),
    venue: "Footprint Center",
    city: "Phoenix",
    state: "Arizona",
    country: "United States",
    countryCode: "US",
    lat: 33.4456,
    lng: -112.0712,
    broadcast: "TNT",
    description:
      "Road trip to the desert. The Dubs head into Phoenix riding a streak and looking for revenge on national TV. Watch rooms light up for tip-off.",
    coverImageUrl: "/watchparty.png",
    stadiumImageUrl:
      "https://images.unsplash.com/photo-1518614368389-c0ce372a37b7?auto=format&fit=crop&w=1600&q=80",
    galleryImageUrls: [
      "/watchparty.png",
      "/warriors_icon.png",
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 17071,
    attendees: pickAttendees([
      0, 2, 6, 9, 12, 14, 17, 20, 22, 28, 30, 33, 35, 38, 40, 42, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open a watch room",
  },
  {
    id: "seed-game-den",
    matchup: "Warriors vs Nuggets",
    isHome: true,
    opponentAbbr: "DEN",
    opponentName: "Denver Nuggets",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(9),
    endAt: daysFromNow(9, 22, 0),
    venue: "Chase Center",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.768,
    lng: -122.3877,
    broadcast: "NBC Sports Bay Area",
    description:
      "Western Conference heavyweight clash. Curry vs Jokic, a chess match between two of the most dynamic offenses in the league. Chase Center will be electric.",
    coverImageUrl: "/court_warriors.png",
    stadiumImageUrl: "/court_warriors.png",
    galleryImageUrls: [
      "/court_warriors.png",
      "/watchparty.png",
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518060797335-c5e7c8fa0ed5?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 18064,
    attendees: pickAttendees([
      0, 1, 2, 3, 5, 7, 11, 13, 14, 16, 19, 22, 24, 26, 28, 30, 32, 33, 36, 38,
      42, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Reserve a room",
  },
  {
    id: "seed-game-dal",
    matchup: "Warriors @ Mavericks",
    isHome: false,
    opponentAbbr: "DAL",
    opponentName: "Dallas Mavericks",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(13),
    endAt: daysFromNow(13, 22, 30),
    venue: "American Airlines Center",
    city: "Dallas",
    state: "Texas",
    country: "United States",
    countryCode: "US",
    lat: 32.7905,
    lng: -96.8104,
    broadcast: "ESPN",
    description:
      "Road clash in Big D. Luka and the Mavs at home, the Dubs looking to spoil the night with a statement win.",
    coverImageUrl: "/watchparty.png",
    stadiumImageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    galleryImageUrls: [
      "/watchparty.png",
      "/warriors_icon.png",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 19200,
    attendees: pickAttendees([
      0, 4, 8, 11, 14, 17, 20, 22, 28, 30, 33, 38, 40, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open a watch room",
  },
  {
    id: "seed-game-bos",
    matchup: "Warriors vs Celtics",
    isHome: true,
    opponentAbbr: "BOS",
    opponentName: "Boston Celtics",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(18),
    endAt: daysFromNow(18, 22, 0),
    venue: "Chase Center",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.768,
    lng: -122.3877,
    broadcast: "ABC",
    description:
      "Finals rematch energy. The Cs come to Chase for a Saturday-night showcase. Expect playoff-level intensity from tip-off.",
    coverImageUrl: "/court_warriors.png",
    stadiumImageUrl: "/playoffnight.png",
    galleryImageUrls: [
      "/court_warriors.png",
      "/warriors_icon.png",
      "/playoffnight.png",
      "https://images.unsplash.com/photo-1518614368389-c0ce372a37b7?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 18064,
    attendees: pickAttendees([
      0, 1, 2, 3, 5, 7, 8, 11, 13, 14, 16, 17, 19, 20, 22, 24, 26, 28, 30, 33,
      35, 38, 40, 42, 44, 46, 48,
    ]),
    goingCount: 0,
    watchRoomCta: "Reserve a room",
  },
  {
    id: "seed-game-okc",
    matchup: "Warriors @ Thunder",
    isHome: false,
    opponentAbbr: "OKC",
    opponentName: "Oklahoma City Thunder",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysFromNow(24),
    endAt: daysFromNow(24, 22, 30),
    venue: "Paycom Center",
    city: "Oklahoma City",
    state: "Oklahoma",
    country: "United States",
    countryCode: "US",
    lat: 35.4634,
    lng: -97.5151,
    broadcast: "TNT",
    description:
      "Tough road test. The Thunder are young, fast, and dangerous at home. Watch rooms open early for the Western Conference clash.",
    coverImageUrl: "/watchparty.png",
    stadiumImageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    galleryImageUrls: [
      "/watchparty.png",
      "/warriors_icon.png",
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518060797335-c5e7c8fa0ed5?auto=format&fit=crop&w=1600&q=80",
    ],
    capacity: 18203,
    attendees: pickAttendees([
      0, 4, 6, 12, 14, 18, 22, 26, 30, 32, 35, 38, 40, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open a watch room",
  },
];

for (const detail of GAME_DETAILS) {
  detail.goingCount = detail.attendees.length;
}

const DETAILS_BY_ID = new Map<string, WarriorsGameDetail>(
  GAME_DETAILS.map((detail) => [detail.id, detail])
);

export function isWarriorsGameId(rawId: string): boolean {
  return rawId.startsWith("seed-game-") || rawId.startsWith("game-");
}

export function getWarriorsGameDetail(
  rawId: string
): WarriorsGameDetail | null {
  return DETAILS_BY_ID.get(rawId) ?? null;
}

export function listWarriorsGameDetails(): WarriorsGameDetail[] {
  return GAME_DETAILS;
}
