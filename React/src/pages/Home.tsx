import { useNavigate } from "react-router-dom";
import {
  FireIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import EventsSlider from "../components/home/EventsSlider";
import NewsSection from "../components/home/NewsSection";
import QuizOfTheWeekCard from "../components/home/QuizOfTheWeekCard";
import ShopSpotlight from "../components/home/ShopSpotlight";
import CTABanner from "../components/home/CTABanner";
import LiveBadge from "../components/common/LiveBadge";
import Button from "../components/ui/Button";
import { useProfile } from "../hooks/useProfile";
import { useWarriorsNews } from "../hooks/useWarriorsNews";
import { useLeaderboardPreview } from "../hooks/useLeaderboardPreview";
import { useRoomsPreview } from "../hooks/useRoomsPreview";
import { useFanaticGame } from "../hooks/useFanatic";
import { useMockScoreboard } from "../hooks/mockScoreboard";

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";
const OPPONENT_LOGOS: Record<string, string> = {
  "Memphis Grizzlies":      "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
  "Los Angeles Lakers":     "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Los Angeles Clippers":   "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
  "Phoenix Suns":           "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
  "Denver Nuggets":         "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
  "Sacramento Kings":       "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
  "Oklahoma City Thunder":  "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
  "Dallas Mavericks":       "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
  "Houston Rockets":        "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
};

// ─── 1. Game Card Hero ────────────────────────────────────────────────────────

function GameCardHero() {
  const navigate = useNavigate();
  const state = useMockScoreboard();
  const opponentLogo = OPPONENT_LOGOS[state.opponent] ?? null;
  const isLive = state.phase === "live" || state.phase === "halftime";

  return (
    <section className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(ellipse at 60% 40%, #1a3a6e 0%, #060e1e 100%)" }}
      />
      {isLive && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-live/20 via-transparent to-transparent" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-transparent" />

      {/* Team logos — decorative, right side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 md:right-14 flex items-center gap-4 md:gap-8">
        <img
          src={WARRIORS_LOGO}
          alt="Golden State Warriors"
          className="h-24 w-24 md:h-40 md:w-40 object-contain opacity-35 md:opacity-45"
        />
        <span className="font-anton text-xl md:text-3xl text-white/20 select-none">vs</span>
        {opponentLogo ? (
          <img
            src={opponentLogo}
            alt={state.opponent}
            className="h-24 w-24 md:h-40 md:w-40 object-contain opacity-35 md:opacity-45"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="h-24 w-24 md:h-40 md:w-40 rounded-full bg-white/8 flex items-center justify-center">
            <span className="font-anton text-sm md:text-xl text-white/30">
              {state.opponent.split(" ").pop()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-full md:max-w-[55%]">

        {/* Kicker */}
        <div className="mb-3 md:mb-4">
          {isLive ? (
            <LiveBadge />
          ) : (
            <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {state.phase === "final" ? "Final" : "Next Game"}
            </p>
          )}
        </div>

        {/* Score / Title */}
        {state.phase === "live" && (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              Warriors{" "}
              <span className="text-primary tabular-nums">{state.warriorsScore}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/70 tabular-nums">{state.opponentScore}</span>{" "}
              {state.opponent.split(" ").pop()}
            </h2>
            <p className="mt-2 font-lato text-sm text-white/55">{state.period}</p>
          </>
        )}
        {state.phase === "halftime" && (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              Warriors{" "}
              <span className="text-primary tabular-nums">{state.warriorsScore}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/70 tabular-nums">{state.opponentScore}</span>{" "}
              {state.opponent.split(" ").pop()}
            </h2>
            <p className="mt-2 font-lato text-sm text-white/55">Halftime</p>
          </>
        )}
        {state.phase === "pre" && (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              Warriors vs {state.opponent}
            </h2>
            <p className="mt-2 font-lato text-sm text-white/55">
              {state.label}
            </p>
          </>
        )}
        {state.phase === "final" && (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              Warriors{" "}
              <span className={`tabular-nums ${state.won ? "text-primary" : "text-white"}`}>{state.warriorsScore}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/60 tabular-nums">{state.opponentScore}</span>{" "}
              {state.opponent.split(" ").pop()}
            </h2>
            <p className={`mt-2 font-lato text-sm font-bold ${state.won ? "text-green-400" : "text-red-400"}`}>
              {state.won ? "Warriors win" : "Warriors lose"}
            </p>
          </>
        )}

        {/* CTA */}
        <div className="mt-5 md:mt-6">
          <Button
            variant="primary"
            onClick={() => navigate(isLive ? "/rooms" : "/events")}
          >
            {isLive ? "Join live room →" : state.phase === "final" ? "View recap →" : "View event →"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── 2. News Hero (shown when no active game) ─────────────────────────────────

function NewsHero() {
  const { news, loading } = useWarriorsNews(1);
  const article = news[0] ?? null;

  if (loading) {
    return <div className="rounded-3xl aspect-[4/5] md:aspect-[21/9] skeleton-shimmer" />;
  }
  if (!article) return null;

  const isBreaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary"
    >
      {article.thumbnail ? (
        <img
          src={article.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top image-zoom"
          loading="eager"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(ellipse at 80% 30%, #1a3a6e 0%, #060e1e 100%)" }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white max-w-full md:max-w-[60%]">
        <div className="mb-3">
          {isBreaking
            ? <LiveBadge label="BREAKING" />
            : <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">Warriors News</p>}
        </div>
        <h2 className="font-anton text-3xl md:text-5xl leading-tight line-clamp-3">{article.title}</h2>
        <p className="mt-3 font-lato text-sm text-white/60 group-hover:text-white/80 transition-colors">
          Read article →
        </p>
      </div>
    </a>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function GreetingLine({ username }: { username: string }) {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <p className="font-lato text-sm text-text-light">
      {time},{" "}
      <span className="font-semibold text-secondary">@{username}</span>.
    </p>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: FireIcon,       label: "Fanatic", desc: "Daily challenge",       to: "/fanatic"  },
    { icon: UserGroupIcon,  label: "Rooms",   desc: "Live watch parties",    to: "/rooms"    },
    { icon: AcademicCapIcon,label: "Quizzes", desc: "Test your Warriors IQ", to: "/quizzes"  },
  ];

  return (
    <section className="mt-16 md:mt-20">
      <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight mb-4 md:mb-6">
        Jump In
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className={`group flex flex-col items-start gap-3 md:gap-4 rounded-3xl bg-white border border-container-border p-4 md:p-6 text-left lift-on-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow fade-in-up stagger-${i + 1}`}
          >
            <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-secondary/[0.07] text-secondary transition-colors group-hover:bg-primary/15">
              <a.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-anton text-lg md:text-xl text-secondary leading-tight">{a.label}</p>
              <p className="mt-0.5 font-lato text-xs text-text-light hidden md:block">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Fanatic Hero (Pattern B) ─────────────────────────────────────────────────

function FanaticHero() {
  const navigate = useNavigate();
  const { status } = useFanaticGame();
  const isActive = status === "active";

  return (
    <section className="mt-16 md:mt-20">
      <article className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary flex items-end">
        {/* Dark navy background with subtle warm glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(ellipse at 25% 65%, #1e3a7a 0%, #060e1e 70%)" }}
        />
        {/* Subtle court SVG overlay */}
        <svg
          viewBox="0 0 400 250"
          className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.035]"
          aria-hidden
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="20" y="20" width="360" height="210" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M 80 20 Q 80 130, 200 130 Q 320 130, 320 20" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="140" y="20" width="120" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="200" cy="100" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        {/* Warriors W — decorative right */}
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-anton text-[9rem] md:text-[13rem] text-primary select-none leading-none opacity-[0.07]"
          aria-hidden
        >
          W
        </span>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
          <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Daily Challenge
          </p>
          <h2 className="font-anton text-2xl md:text-4xl text-white leading-tight">
            {isActive ? "Who is today's Warrior?" : "Fanatic is resting"}
          </h2>
          <p className="font-lato text-sm text-white/60">
            {isActive
              ? "Guess the player from the clues. New challenge every game day."
              : "A new challenge drops before every game day."}
          </p>
          <Button variant="primary" onClick={() => navigate("/fanatic")} disabled={!isActive}>
            {isActive ? "Play now →" : "Check back soon"}
          </Button>
        </div>
      </article>
    </section>
  );
}

// ─── Rooms Rail ───────────────────────────────────────────────────────────────

function HomeRooms() {
  const navigate = useNavigate();
  const { rooms, loading } = useRoomsPreview(5);

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">Your Rooms</h2>
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
          aria-label="See all rooms"
        >
          See all →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`snap-start shrink-0 w-[260px] h-[180px] rounded-2xl skeleton-shimmer fade-in-up stagger-${i + 1}`} />
            ))
          : [
              ...rooms.map((room, i) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(room.status === "live" ? `/rooms/${room.id}` : "/rooms")}
                  className={`group snap-start relative shrink-0 w-[260px] h-[180px] overflow-hidden rounded-2xl text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  aria-label={room.title}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ backgroundColor: room.accent ?? "#1D428A" }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: "radial-gradient(ellipse at 25% 30%, rgba(255,199,44,0.07) 0%, transparent 55%)" }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {room.status === "live" && (
                    <div className="absolute top-3 right-3">
                      <LiveBadge />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-lato text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/45 mb-1">
                      Watch party
                    </p>
                    <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">{room.title}</h3>
                    <p className="font-lato text-xs text-white/45 mt-1 tabular-nums">{room.members}</p>
                  </div>
                </button>
              )),
              <button
                key="create"
                type="button"
                onClick={() => navigate("/rooms/create")}
                className="group snap-start shrink-0 w-[260px] h-[180px] rounded-2xl border-2 border-dashed border-container-border hover:border-secondary transition-colors focus:outline-none flex flex-col items-center justify-center gap-3 lift-on-hover"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.06] text-secondary group-hover:bg-secondary/10 transition-colors">
                  <UserGroupIcon className="h-6 w-6" />
                </span>
                <span className="font-lato text-sm font-bold text-text-light group-hover:text-secondary transition-colors">
                  Create a room
                </span>
              </button>,
            ]}
      </div>
    </section>
  );
}

// ─── Leaderboard (Pattern C) ──────────────────────────────────────────────────

function HomeLeaderboard() {
  const navigate = useNavigate();
  const { top, me, loading } = useLeaderboardPreview(5);

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">Leaderboard</h2>
        <button
          type="button"
          onClick={() => navigate("/ranking")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
        >
          Full leaderboard →
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-container-border p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-4 py-3 border-b border-container-border/40 last:border-0 fade-in-up stagger-${i + 1}`}>
                <div className="w-8 h-4 rounded skeleton-shimmer shrink-0" />
                <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 h-4 rounded skeleton-shimmer" />
                <div className="w-16 h-4 rounded skeleton-shimmer shrink-0" />
              </div>
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="font-lato text-sm text-text-light text-center py-8">
            Tip-off hasn't happened. Be the first on the board.
          </p>
        ) : (
          <ol className="flex flex-col">
            {top.map((entry, i) => (
              <li
                key={entry.profileId}
                className={`flex items-center gap-3 md:gap-4 border-b border-container-border/40 last:border-0 fade-in-up stagger-${Math.min(i + 1, 6)} ${
                  i === 0
                    ? "py-4 -mx-4 md:-mx-6 px-4 md:px-6 bg-primary/[0.06] rounded-2xl"
                    : "py-3"
                }`}
              >
                <span className={`font-anton tabular-nums w-7 text-right shrink-0 ${i === 0 ? "text-xl text-primary" : "text-lg text-secondary/40"}`}>
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <div className={`shrink-0 rounded-full overflow-hidden bg-secondary ${i === 0 ? "h-11 w-11" : "h-9 w-9"}`}>
                  {entry.avatarUrl
                    ? <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    : <UserCircleIcon className="h-full w-full text-white/70" />}
                </div>
                <span className={`flex-1 min-w-0 truncate font-lato font-bold ${i === 0 ? "text-base text-secondary" : "text-sm text-text"}`}>
                  @{entry.username}
                </span>
                <span className={`font-anton tabular-nums shrink-0 ${i === 0 ? "text-xl text-secondary" : "text-base text-secondary/65"}`}>
                  {entry.points.toLocaleString()}
                </span>
              </li>
            ))}

            {me && !top.some((e) => e.profileId === me.profileId) && (
              <>
                <li className="my-2 border-t border-container-border" aria-hidden />
                <li className="flex items-center gap-3 md:gap-4 py-3 -mx-4 md:-mx-6 px-4 md:px-6 bg-primary/[0.04] rounded-2xl fade-in-up stagger-6">
                  <span className="font-anton text-lg tabular-nums w-7 text-right shrink-0 text-secondary">
                    {String(me.rank).padStart(2, "0")}
                  </span>
                  <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-secondary">
                    {me.avatarUrl
                      ? <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      : <UserCircleIcon className="h-full w-full text-white/70" />}
                  </div>
                  <span className="flex-1 min-w-0 truncate font-lato font-bold text-sm text-text">You</span>
                  <span className="font-anton text-base tabular-nums shrink-0 text-primary">
                    {me.points.toLocaleString()}
                  </span>
                </li>
              </>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}

// ─── Stats Promo (Pattern B) ──────────────────────────────────────────────────

function StatsPromo() {
  const navigate = useNavigate();
  return (
    <section className="mt-16 md:mt-20">
      <button
        type="button"
        onClick={() => navigate("/stats")}
        className="group relative block w-full overflow-hidden rounded-3xl bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[16/9] md:aspect-[3/1]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(ellipse at 75% 40%, #1a3a6e 0%, #060e1e 100%)" }}
          />
          {/* Court decoration */}
          <svg
            viewBox="0 0 400 250"
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 text-white opacity-[0.04]"
            aria-hidden
            preserveAspectRatio="xMaxYMid meet"
          >
            <rect x="20" y="20" width="360" height="210" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 200 20 Q 200 130, 380 130" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="260" y="20" width="120" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="320" cy="100" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
          <ChartBarIcon className="absolute right-5 top-5 md:right-10 md:top-10 h-24 w-24 md:h-40 md:w-40 text-primary opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" />

          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 md:p-12 max-w-lg">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">Season Stats</p>
            <h2 className="font-anton text-2xl md:text-4xl text-white leading-tight">
              Analyze the 2025–26 Warriors season
            </h2>
            <p className="font-lato text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Explore stats →
            </p>
          </div>
        </div>
      </button>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;
  const scoreboard = useMockScoreboard();
  const showGameCard = scoreboard.phase !== "final";

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        {/* 1. Game Card OR News Hero */}
        <div className="fade-in-up stagger-1">
          {showGameCard ? <GameCardHero /> : <NewsHero />}
        </div>

        {/* Greeting — editorial text, never a hero */}
        {isLoggedIn && user && (
          <div className="mt-4 fade-in-up stagger-2">
            <GreetingLine username={user.username ?? "fan"} />
          </div>
        )}

        {/* 2. News Rail */}
        <div className="mt-16 md:mt-20">
          <NewsSection />
        </div>

        {/* 3. Events Rail */}
        <div className="mt-16 md:mt-20">
          <EventsSlider />
        </div>

        {/* 4. Jump In */}
        <QuickActions />

        {/* 5. Fanatic */}
        <FanaticHero />

        {/* 6. Rooms */}
        <HomeRooms />

        {/* 7. Leaderboard */}
        <HomeLeaderboard />

        {/* 8. Stats */}
        <StatsPromo />

        {/* 9. Warriors Shop */}
        <section className="mt-16 md:mt-20">
          <div className="flex items-baseline justify-between mb-4 md:mb-6">
            <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">Warriors Shop</h2>
          </div>
          <ShopSpotlight />
        </section>

        {/* 10. Quiz of the Week */}
        <div className="mt-16 md:mt-20">
          <QuizOfTheWeekCard />
        </div>

        {/* CTA — logged-out only */}
        {!isLoggedIn && hasLoadedOnce && (
          <div className="mt-16 md:mt-20">
            <CTABanner />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
