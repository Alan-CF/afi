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
  galleryImageUrls: string[];
  capacity: number;
  attendees: WarriorsGameAttendee[];
  goingCount: number;
  watchRoomCta: string;
  isPast?: boolean;
  finalWarriorsScore?: number;
  finalOpponentScore?: number;
}

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";

function daysFromNow(days: number, hour = 19, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgo(days: number, hour = 19, minute = 30): string {
  return daysFromNow(-days, hour, minute);
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
      "Game 38 of the season. Battle of California at Chase Center. The Dubs come in 22-15 looking to extend their home streak; the Lakers sit at 19-18 and are hunting consistency. Last meeting on the road: Warriors 124, Lakers 118 in overtime. Watch Curry vs Reaves on the perimeter and Draymond vs Davis in the paint. Doors open 90 minutes before tip-off, bring your gold towels.",
    coverImageUrl: "/chasecenter.png",
    galleryImageUrls: [
      "/chasecenter.png",
      "/chasecenter2.png",
      "/chasecenter3.png",
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
      "Game 40 of the season. Road trip to the desert for a primetime TNT slot. The Dubs split last season's series 2-2, with the most recent game in Phoenix going to overtime. Booker and Curry will trade three-balls; the matchup turns on how the Warriors handle the Suns' switch-heavy defense. Footprint Center always brings the noise on national TV.",
    coverImageUrl: "/footprintcenter.png",
    galleryImageUrls: [
      "/footprintcenter.png",
      "/footprintcenter2.png",
      "/footprintcenter3.png",
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
      "Game 43 of the season. Western Conference heavyweight clash at Chase Center. Last meeting went to Denver 117-114 in March. Curry vs Jokic is a chess match between two of the most dynamic offenses in the league. Watch how Draymond handles Jokic in the post and whether the Dubs can survive the third-quarter run Denver always brings. Chase Center will be electric.",
    coverImageUrl: "/chasecenter.png",
    galleryImageUrls: [
      "/chasecenter.png",
      "/chasecenter2.png",
      "/chasecenter3.png",
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
      "Game 47 of the season. Road clash in Big D. Luka and the Mavs are 26-15 at home this year. The Dubs lost the last meeting 119-110 in Dallas, with Doncic dropping 38. Watch Curry try to neutralize Luka's pick-and-roll game and how the Warriors' bench answers. American Airlines Center is one of the toughest road environments in the West.",
    coverImageUrl: "/americanairlinescenter.png",
    galleryImageUrls: [
      "/americanairlinescenter.png",
      "/americanairlinescenter2.png",
      "/americanairlinescenter3.png",
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
      "Game 51 of the season. Finals rematch energy. The Celtics roll in at 30-12, the Dubs at 27-22. Saturday-night showcase on ABC. Last meeting: Boston 132, Warriors 126 at TD Garden. Expect playoff-level intensity from tip-off, Tatum vs Curry on the wing, Jrue Holiday navigating Steph's off-ball screens. Chase Center under the lights.",
    coverImageUrl: "/chasecenter.png",
    galleryImageUrls: [
      "/chasecenter.png",
      "/chasecenter2.png",
      "/chasecenter3.png",
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
      "Game 54 of the season. Tough road test in OKC against the league's youngest top-3 team. The Thunder sit at 32-11, the Dubs at 28-25. SGA and Chet bring length and speed; the Warriors counter with experience and pace. Last meeting in OKC went to the Thunder 128-109. Watch how the Dubs handle the Paycom Center crowd.",
    coverImageUrl: "/paycom.png",
    galleryImageUrls: [
      "/paycom.png",
      "/paycomcenter2.png",
      "/paycomcenter3.png",
    ],
    capacity: 18203,
    attendees: pickAttendees([
      0, 4, 6, 12, 14, 18, 22, 26, 30, 32, 35, 38, 40, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open a watch room",
  },
];

const PAST_GAME_DETAILS: WarriorsGameDetail[] = [
  {
    id: "seed-game-past-lal",
    matchup: "Warriors vs Lakers",
    isHome: true,
    opponentAbbr: "LAL",
    opponentName: "Los Angeles Lakers",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysAgo(8),
    endAt: daysAgo(8, 22, 0),
    venue: "Chase Center",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.768,
    lng: -122.3877,
    broadcast: "ESPN",
    description:
      "Chase Center game 32. The Dubs leaned on a clutch fourth-quarter run to seal it on national TV. Curry: 31 pts, Wiggins: 22, Draymond: 12 reb / 9 ast. James led all scorers with 34 for the Lakers, but the Warriors closed strong.",
    coverImageUrl: "/chasecenter.png",
    galleryImageUrls: [
      "/chasecenter.png",
      "/chasecenter2.png",
      "/chasecenter3.png",
    ],
    capacity: 18064,
    attendees: pickAttendees([
      0, 1, 3, 5, 7, 11, 13, 14, 17, 19, 22, 24, 28, 30, 33, 38, 42, 46, 8, 12,
      20,
    ]),
    goingCount: 0,
    watchRoomCta: "Open replay room",
    isPast: true,
    finalWarriorsScore: 118,
    finalOpponentScore: 112,
  },
  {
    id: "seed-game-past-dal",
    matchup: "Warriors @ Mavericks",
    isHome: false,
    opponentAbbr: "DAL",
    opponentName: "Dallas Mavericks",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysAgo(15),
    endAt: daysAgo(15, 22, 30),
    venue: "American Airlines Center",
    city: "Dallas",
    state: "Texas",
    country: "United States",
    countryCode: "US",
    lat: 32.7905,
    lng: -96.8104,
    broadcast: "ESPN",
    description:
      "Road shootout in Big D, game 28 of the season. Doncic went 34/9/7 vs Curry 28/6/5. Defensive lapses on Luka's pick-and-roll cost the Dubs the closing minutes; the call went the home team's way at the buzzer.",
    coverImageUrl: "/americanairlinescenter.png",
    galleryImageUrls: [
      "/americanairlinescenter.png",
      "/americanairlinescenter2.png",
      "/americanairlinescenter3.png",
    ],
    capacity: 19200,
    attendees: pickAttendees([
      0, 4, 8, 11, 14, 17, 20, 22, 28, 30, 33, 38, 40, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open replay room",
    isPast: true,
    finalWarriorsScore: 104,
    finalOpponentScore: 109,
  },
  {
    id: "seed-game-past-okc",
    matchup: "Warriors @ Thunder",
    isHome: false,
    opponentAbbr: "OKC",
    opponentName: "Oklahoma City Thunder",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysAgo(22),
    endAt: daysAgo(22, 22, 30),
    venue: "Paycom Center",
    city: "Oklahoma City",
    state: "Oklahoma",
    country: "United States",
    countryCode: "US",
    lat: 35.4634,
    lng: -97.5151,
    broadcast: "TNT",
    description:
      "Road game 24. SGA dropped 38 to lead all scorers, Chet added 22 and 12 rebounds. The Dubs hung in late but a 16-2 OKC run early in the fourth opened the gap. Curry finished 26 on 9-21 shooting.",
    coverImageUrl: "/paycom.png",
    galleryImageUrls: [
      "/paycom.png",
      "/paycomcenter2.png",
      "/paycomcenter3.png",
    ],
    capacity: 18203,
    attendees: pickAttendees([
      0, 4, 6, 12, 14, 18, 22, 26, 30, 32, 35, 38, 40, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open replay room",
    isPast: true,
    finalWarriorsScore: 99,
    finalOpponentScore: 113,
  },
  {
    id: "seed-game-past-phx",
    matchup: "Warriors @ Suns",
    isHome: false,
    opponentAbbr: "PHX",
    opponentName: "Phoenix Suns",
    opponentLogo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    warriorsLogo: WARRIORS_LOGO,
    startAt: daysAgo(34),
    endAt: daysAgo(34, 22, 30),
    venue: "Footprint Center",
    city: "Phoenix",
    state: "Arizona",
    country: "United States",
    countryCode: "US",
    lat: 33.4456,
    lng: -112.0712,
    broadcast: "NBC Sports Bay Area",
    description:
      "Desert road win in game 16. Splash Brothers combined for 60 — Curry 33, Klay 27. Wiggins added 18, the bench contributed 32. Booker had 34 for Phoenix but couldn't keep up with the Dubs' pace in the second half.",
    coverImageUrl: "/footprintcenter.png",
    galleryImageUrls: [
      "/footprintcenter.png",
      "/footprintcenter2.png",
      "/footprintcenter3.png",
    ],
    capacity: 17071,
    attendees: pickAttendees([
      0, 2, 6, 9, 12, 14, 17, 20, 22, 28, 30, 33, 35, 38, 40, 42, 44, 46,
    ]),
    goingCount: 0,
    watchRoomCta: "Open replay room",
    isPast: true,
    finalWarriorsScore: 122,
    finalOpponentScore: 110,
  },
];

for (const detail of GAME_DETAILS) {
  detail.goingCount = detail.attendees.length;
}

for (const detail of PAST_GAME_DETAILS) {
  detail.goingCount = detail.attendees.length;
}

const DETAILS_BY_ID = new Map<string, WarriorsGameDetail>(
  [...GAME_DETAILS, ...PAST_GAME_DETAILS].map((detail) => [detail.id, detail])
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

export function listWarriorsGameDetailsPast(): WarriorsGameDetail[] {
  return PAST_GAME_DETAILS;
}
