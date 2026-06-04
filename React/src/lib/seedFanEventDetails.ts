export interface SeedEventAttendee {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface SeedEventOrganizer {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  points?: number | null;
  streak?: number | null;
  rank?: number | null;
}

export interface SeedFanEventDetail {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  tags: string[];
  coverImageUrl: string;
  galleryImageUrls: string[];
  startAt: string;
  endAt: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  capacity: number;
  goingCount: number;
  isPublic: boolean;
  organizer: SeedEventOrganizer;
  attendees: SeedEventAttendee[];
}

function daysFromNow(days: number, hour = 19, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgo(days: number, hour = 19, minute = 30): string {
  return daysFromNow(-days, hour, minute);
}

const HANDLE_POOL: string[] = [
  "splashmode30",
  "dubnation23",
  "baytrey",
  "chasecrew",
  "goldblooded",
  "threesandvibes",
  "dunkmasterr",
  "warriorswave",
  "currycorner",
  "klaystation",
  "draydefense",
  "bluegoldenergy",
  "hooporacle",
  "finalsbounce",
  "splashtribe",
  "oaklandbaseline",
  "missionbaydub",
  "fastbreakfan",
  "paintpatrol",
  "roaraclelegacy",
  "bridgecitybuckets",
  "pacificrimhoops",
  "thirdandquarter",
  "gildedhardwood",
  "thecitydrip",
  "westcoastswish",
  "nbabaywoke",
  "chasecenterstan",
  "alleyoopacademy",
  "finalsfever",
  "buckethunter",
  "transitiongame",
  "pickandbay",
  "thunderdubs",
  "crossover77",
  "baselinebros",
  "hooponly",
  "swishrepublic",
  "coastrhythm",
  "gameopsweekly",
  "rollersnaps",
  "bayhardwood",
  "tipoffkid",
  "splashbros4ever",
  "oaklandloyal",
  "goldenmotion",
  "thedubreport",
  "cityedition23",
  "roaracleforever",
  "pickrollnation",
];

function pickAttendees(indices: number[]): SeedEventAttendee[] {
  const unique = Array.from(new Set(indices));
  return unique.map((index) => ({
    id: `poolfan-${index}`,
    username: HANDLE_POOL[index],
    avatarUrl: null,
  }));
}

const SEED_DETAILS: SeedFanEventDetail[] = [
  {
    id: "seed-fan-watch-mission",
    title: "Watch Party · Mission Bay",
    description:
      "Join Dub Nation at The Yard for a high-energy watch party as the Warriors take on a marquee Western Conference rival. Big screens, surround sound, and a packed beer garden right next to Chase Center. We'll have pre-game shootaround predictions, free Splash Brothers stickers, and a half-court shot raffle for a signed Curry mini-ball at halftime. Whether you're rocking a throwback jersey or your fresh '26 City Edition, this is the home of game-day in San Francisco. Doors open one hour before tip-off, come early to grab a spot at the rail.",
    highlights: [
      "Outdoor beer garden with big screens",
      "Halftime half-court shot raffle",
      "Free Splash Brothers stickers for the first 100 fans",
      "Postgame DJ set if the Warriors win",
    ],
    tags: ["Watch Party", "Family Friendly", "Outdoor", "Dub Nation"],
    coverImageUrl: "/watchparty.png",
    galleryImageUrls: [
      "/watchparty.png",
      "/watchoartymissionbay2.png",
      "/watchpartymissionbay3.png",
      "/chasecenter.png",
    ],
    startAt: daysFromNow(2, 18, 30),
    endAt: daysFromNow(2, 23, 0),
    venue: "The Yard at Mission Rock",
    address: "100 Channel St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7706,
    lng: -122.3893,
    capacity: 220,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-the-yard",
      username: "theyard.sf",
      name: "The Yard SF",
      avatarUrl: null,
      bio: "Outdoor beer garden steps from Chase Center. Every home game, every road game.",
    },
    attendees: pickAttendees([
      0, 1, 2, 3, 5, 7, 8, 11, 13, 14, 16, 17, 19, 20, 22, 24, 28, 30, 33, 38,
      42, 46,
    ]),
  },
  {
    id: "seed-fan-jersey-signing",
    title: "Legends Jersey Signing",
    description:
      "A rare in-store signing session with three Warriors legends. Bring your jersey, photo, or fresh merch from the Pop-up Store, every fan with a ticket gets one signature. Numbered wristbands released at 12:00 PM sharp; arrive early to secure your spot in line. We'll have a photo booth set up with throwback Warriors backdrops, plus exclusive Pop-up Store discounts on retro gear during the event. Limited to the first 300 fans. No professional photography please.",
    highlights: [
      "Three legends signing in person",
      "Photo booth with throwback backdrops",
      "20% off retro gear during the event",
      "Wristbands at noon, signing starts at 2 PM",
    ],
    tags: ["Meetup", "Family Friendly"],
    coverImageUrl: "/jerseysign2.png",
    galleryImageUrls: [
      "/jerseysign2.png",
      "/jerseysign3.png",
      "/jerseysign4.png",
    ],
    startAt: daysFromNow(7, 14, 0),
    endAt: daysFromNow(7, 17, 0),
    venue: "Warriors Pop-up Store",
    address: "601 1st St",
    city: "Oakland",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7505,
    lng: -122.2034,
    capacity: 300,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-warriors-popup",
      username: "warriors.popup",
      name: "Warriors Pop-up Store",
      avatarUrl: null,
      bio: "Official Warriors merch hub in Oakland. Drops, signings, and limited collabs.",
    },
    attendees: pickAttendees([
      0, 4, 6, 9, 10, 12, 15, 21, 23, 25, 27, 29, 32, 49,
    ]),
  },
  {
    id: "seed-fan-bay-bridge-run",
    title: "Bay Bridge Fan Run",
    description:
      "Lace up for the annual Bay Bridge Fan Run, a 5K and 10K loop along Crissy Field with the Golden Gate as your backdrop. All proceeds go to the Warriors Community Foundation youth basketball program. Every runner gets a limited-edition tech tee, race bib, and a cold drink at the finish line. Stick around for the postrace shootaround clinic led by Warriors alumni and a raffle for two lower-bowl playoff tickets. Strollers welcome on the 5K route. Pups on leash welcome at the start line.",
    highlights: [
      "5K and 10K routes along the bay",
      "Limited-edition tech tee for every runner",
      "Postrace shootaround clinic with alumni",
      "Raffle for two lower-bowl playoff tickets",
    ],
    tags: ["Charity", "Outdoor", "Family Friendly", "Free"],
    coverImageUrl: "/baybridgefanrun.png",
    galleryImageUrls: [
      "/baybridgefanrun.png",
      "/baybridgefanrun2.png",
      "/baybridgefanrun3.png",
      "/baybridgefanrun4.png",
    ],
    startAt: daysFromNow(11, 8, 0),
    endAt: daysFromNow(11, 12, 0),
    venue: "Crissy Field East Lawn",
    address: "199 Mason St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.8027,
    lng: -122.4664,
    capacity: 500,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-warriors-foundation",
      username: "warriors.foundation",
      name: "Warriors Community Foundation",
      avatarUrl: null,
      bio: "Funding youth basketball and education across the Bay Area.",
    },
    attendees: pickAttendees([
      0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 16, 17, 19, 20, 21, 22, 24, 28,
      30, 32, 33, 38, 40, 42, 46,
    ]),
  },
  {
    id: "seed-fan-trivia-night",
    title: "Warriors Trivia Night",
    description:
      "Six rounds of Warriors trivia spanning the entire franchise, from the Rick Barry era to the dynasty years and last week's box score. Form a team of up to four, or solo-queue at the bar and we'll match you with other diehards. Winning team takes home a $200 bar tab and a signed photo. Free entry, table reservations strongly recommended. Themed cocktails like the Steph Splash and Draymond's Triple-Double will be on the menu all night.",
    highlights: [
      "6 rounds, all-eras Warriors trivia",
      "Teams up to 4, solo welcome",
      "$200 bar tab + signed photo for the winners",
      "Themed cocktail menu all night",
    ],
    tags: ["Meetup", "21+", "Free", "Game Day"],
    coverImageUrl: "/trivianight.png",
    galleryImageUrls: [
      "/trivianight.png",
      "/trivianight2.png",
      "/trivianight3.png",
      "/trivianight4.png",
    ],
    startAt: daysFromNow(15, 20, 0),
    endAt: daysFromNow(15, 23, 30),
    venue: "Bartlett Hall",
    address: "242 O'Farrell St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7866,
    lng: -122.4099,
    capacity: 90,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-bartlett-hall",
      username: "bartletthall",
      name: "Bartlett Hall",
      avatarUrl: null,
      bio: "Union Square gastropub. Weekly Bay Area sports trivia nights.",
    },
    attendees: pickAttendees([
      0, 5, 8, 11, 14, 18, 22, 26, 31, 35, 39, 44,
    ]),
  },
  {
    id: "seed-fan-court-session",
    title: "Pickup at the Pier",
    description:
      "Open run on the bayfront courts at Pier 70. Bring a reversible jersey and your shoes, we run four-on-four full court, winners stay on, runs reset every 60 minutes. Skill level: weekend warrior to former college walk-on. No refs, calls are honor system. Bring your own water, we'll have a cooler with electrolyte refills for the first 30 to show up. Free, no entry fee, all ages welcome on Court B. Court A is open run for serious hoopers only.",
    highlights: [
      "Four-on-four full court, winners stay on",
      "Bayfront courts at Pier 70",
      "Free electrolytes for the first 30",
      "Court B for all ages, Court A for serious hoopers",
    ],
    tags: ["Pickup", "Outdoor", "Free"],
    coverImageUrl: "/pickuppier.png",
    galleryImageUrls: [
      "/pickuppier.png",
      "/pickuppier2.png",
      "/pickuppier3.png",
      "/pickuppier4.png",
    ],
    startAt: daysFromNow(20, 17, 0),
    endAt: daysFromNow(20, 20, 30),
    venue: "Pier 70 Outdoor Courts",
    address: "420 22nd St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7616,
    lng: -122.387,
    capacity: 60,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-pier70-courts",
      username: "pier70.run",
      name: "Pier 70 Runs",
      avatarUrl: null,
      bio: "Weekly pickup runs on the SF waterfront. No frills, just hoops.",
    },
    attendees: pickAttendees([
      3, 5, 8, 11, 14, 17, 20, 22, 28, 30, 32, 33, 35, 38, 40, 42, 44, 46, 47,
      0,
    ]),
  },
  {
    id: "seed-fan-finals-watch",
    title: "Playoff Night CDMX",
    description:
      "The biggest Warriors watch party south of the border. Reforma Sports Bar transforms into Dub Nation HQ for playoff night, every screen, every angle, every play. Mexican food specials all night, drink towers on table reservations, and a giveaway for a signed Klay Thompson jersey. Spanish and English commentary on dual channels. Doors open three hours before tip-off; arrive early, last playoff watch sold out in 45 minutes.",
    highlights: [
      "Every screen tuned to the Warriors",
      "Signed Klay Thompson jersey giveaway",
      "Mexican food specials and drink towers",
      "Spanish + English commentary",
    ],
    tags: ["Watch Party", "Game Day", "21+", "Food"],
    coverImageUrl: "/playoffnightcdmx.png",
    galleryImageUrls: [
      "/playoffnightcdmx.png",
      "/playoffnightcdmx2.png",
      "/playoffnightcdmx3.png",
      "/playoffnight3.png",
    ],
    startAt: daysFromNow(28, 19, 0),
    endAt: daysFromNow(28, 23, 30),
    venue: "Reforma Sports Bar",
    address: "Av. Paseo de la Reforma 222",
    city: "Mexico City",
    state: "Ciudad de Mexico",
    country: "Mexico",
    countryCode: "MX",
    lat: 19.4326,
    lng: -99.167,
    capacity: 240,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-reforma-sports",
      username: "reforma.sports",
      name: "Reforma Sports Bar",
      avatarUrl: null,
      bio: "El punto de encuentro de Dub Nation en CDMX. Cada partido, cada playoff.",
    },
    attendees: pickAttendees([
      0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36,
      38, 40, 42, 44, 46, 48,
    ]),
  },
];

const PAST_SEED_DETAILS: SeedFanEventDetail[] = [
  {
    id: "seed-fan-past-dub-watch-night",
    title: "Dub Nation Watch Night",
    description:
      "Sold-out watch night that filled The Yard for the Warriors road sweep. Big screens, gold towels handed out at the door, and a halftime free-throw contest. Thanks for showing up.",
    highlights: [
      "Sold-out watch night",
      "Halftime free-throw contest",
      "Gold towels at the door",
    ],
    tags: ["Watch Party", "Past", "Dub Nation"],
    coverImageUrl: "/watchparty.png",
    galleryImageUrls: [
      "/watchparty.png",
      "/watchoartymissionbay2.png",
      "/watchpartymissionbay3.png",
      "/chasecenter.png",
    ],
    startAt: daysAgo(12, 18, 30),
    endAt: daysAgo(12, 23, 0),
    venue: "The Yard at Mission Rock",
    address: "100 Channel St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7706,
    lng: -122.3893,
    capacity: 220,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-the-yard",
      username: "theyard.sf",
      name: "The Yard SF",
      avatarUrl: null,
      bio: "",
    },
    attendees: pickAttendees([
      0, 2, 5, 7, 11, 13, 14, 16, 19, 20, 22, 24, 28, 30, 33, 38, 42, 46,
    ]),
  },
  {
    id: "seed-fan-past-jersey-throwback",
    title: "Jersey Signing Throwback",
    description:
      "A throwback in-store signing with two Warriors legends. The line wrapped around the block. Fans walked away with autographed retro jerseys and Polaroids by the backdrop.",
    highlights: [
      "Two legends, wrap-around line",
      "Throwback backdrop Polaroids",
      "Retro gear discounts",
    ],
    tags: ["Meetup", "Past"],
    coverImageUrl: "/jerseysign2.png",
    galleryImageUrls: [
      "/jerseysign2.png",
      "/jerseysign3.png",
      "/jerseysign4.png",
    ],
    startAt: daysAgo(26, 14, 0),
    endAt: daysAgo(26, 17, 0),
    venue: "Warriors Pop-up Store",
    address: "601 1st St",
    city: "Oakland",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7505,
    lng: -122.2034,
    capacity: 300,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-warriors-popup",
      username: "warriors.popup",
      name: "Warriors Pop-up Store",
      avatarUrl: null,
      bio: "",
    },
    attendees: pickAttendees([
      0, 4, 6, 9, 10, 12, 15, 21, 23, 25, 27, 29, 32, 49,
    ]),
  },
  {
    id: "seed-fan-past-bay-run-community",
    title: "Bay Run Community Day",
    description:
      "Two thousand runners along the Crissy Field loop for the spring charity run. Every finisher got a tech tee and a high-five from Warriors alumni at the finish line.",
    highlights: [
      "Two thousand finishers",
      "Alumni high-fives at the finish",
      "Tech tees for every runner",
    ],
    tags: ["Charity", "Past", "Outdoor"],
    coverImageUrl: "/baybridgefanrun.png",
    galleryImageUrls: [
      "/baybridgefanrun.png",
      "/baybridgefanrun2.png",
      "/baybridgefanrun3.png",
      "/baybridgefanrun4.png",
    ],
    startAt: daysAgo(45, 8, 0),
    endAt: daysAgo(45, 12, 0),
    venue: "Crissy Field East Lawn",
    address: "199 Mason St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.8027,
    lng: -122.4664,
    capacity: 2200,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-warriors-foundation",
      username: "warriors.foundation",
      name: "Warriors Community Foundation",
      avatarUrl: null,
      bio: "",
    },
    attendees: pickAttendees([
      0, 1, 3, 5, 7, 11, 13, 16, 19, 22, 24, 28, 30, 33, 38, 42, 46, 8, 12,
      32, 40, 44,
    ]),
  },
  {
    id: "seed-fan-past-trivia-finals",
    title: "Warriors Trivia Finals Night",
    description:
      "End-of-season trivia finals at Bartlett Hall. Six rounds, four teams in the final, a $400 bar tab to the winners. Standing room only.",
    highlights: [
      "End-of-season trivia finals",
      "Four-team final round",
      "$400 bar tab to winners",
    ],
    tags: ["Meetup", "Past", "21+"],
    coverImageUrl: "/trivianight.png",
    galleryImageUrls: [
      "/trivianight.png",
      "/trivianight2.png",
      "/trivianight3.png",
      "/trivianight4.png",
    ],
    startAt: daysAgo(60, 20, 0),
    endAt: daysAgo(60, 23, 30),
    venue: "Bartlett Hall",
    address: "242 O'Farrell St",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7866,
    lng: -122.4099,
    capacity: 110,
    goingCount: 0,
    isPublic: true,
    organizer: {
      id: "seed-org-bartlett-hall",
      username: "bartletthall",
      name: "Bartlett Hall",
      avatarUrl: null,
      bio: "",
    },
    attendees: pickAttendees([
      0, 5, 8, 11, 14, 18, 22, 26, 31, 35, 39, 44, 7, 16, 30,
    ]),
  },
];

for (const detail of SEED_DETAILS) {
  detail.goingCount = detail.attendees.length;
}

for (const detail of PAST_SEED_DETAILS) {
  detail.goingCount = detail.attendees.length;
}

const DETAILS_BY_ID = new Map<string, SeedFanEventDetail>(
  [...SEED_DETAILS, ...PAST_SEED_DETAILS].map((detail) => [detail.id, detail])
);

export function isSeedFanEventId(rawId: string): boolean {
  return rawId.startsWith("seed-");
}

export function getSeedFanEventDetail(
  rawId: string
): SeedFanEventDetail | null {
  return DETAILS_BY_ID.get(rawId) ?? null;
}

export function listSeedFanEventDetails(): SeedFanEventDetail[] {
  return SEED_DETAILS;
}

export function listSeedFanEventDetailsPast(): SeedFanEventDetail[] {
  return PAST_SEED_DETAILS;
}

export function listSeedHandlePool(): string[] {
  return HANDLE_POOL;
}
