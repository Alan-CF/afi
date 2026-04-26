import { useNavigate } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useEventsFeed } from "../hooks/useEventsFeed";
import type { UnifiedEvent } from "../hooks/events";
import LiveBadge from "../components/common/LiveBadge";
import EmptyState from "../components/common/EmptyState";

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";
const NBA_LOGOS: Record<string, string> = {
  "Sacramento Kings":       "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
  "Los Angeles Lakers":     "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Los Angeles Clippers":   "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
  "Phoenix Suns":           "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
  "Denver Nuggets":         "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
  "Oklahoma City Thunder":  "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
  "Minnesota Timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
  "Dallas Mavericks":       "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
  "Houston Rockets":        "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
  "Memphis Grizzlies":      "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
  "Portland Trail Blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
  "Utah Jazz":              "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
  "San Antonio Spurs":      "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
  "New Orleans Pelicans":   "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
  "Boston Celtics":         "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
  "Miami Heat":             "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
  "Milwaukee Bucks":        "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
  "Cleveland Cavaliers":    "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
  "New York Knicks":        "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
  "Philadelphia 76ers":     "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
  "Atlanta Hawks":          "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
  "Chicago Bulls":          "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
  "Toronto Raptors":        "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
  "Brooklyn Nets":          "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
  "Indiana Pacers":         "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
  "Charlotte Hornets":      "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
  "Washington Wizards":     "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
  "Detroit Pistons":        "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  "Orlando Magic":          "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function NextGameHero({ event }: { event: UnifiedEvent }) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;
  const opponentLogo = event.subtitle ? NBA_LOGOS[event.subtitle] ?? null : null;

  return (
    <section className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(ellipse at 70% 40%, #1a3a6e 0%, #060e1e 100%)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
      {isLive && <div className="absolute inset-0 bg-gradient-to-t from-live/35 via-transparent to-transparent pointer-events-none" />}

      <div className="absolute right-6 md:right-16 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-8 opacity-25">
        <img src={WARRIORS_LOGO} alt="GSW" className="h-36 w-36 object-contain" />
        <span className="font-anton text-5xl text-white">{event.meta.isHome ? "vs" : "@"}</span>
        {opponentLogo
          ? <img src={opponentLogo} alt={event.subtitle ?? ""} className="h-36 w-36 object-contain" />
          : <div className="h-36 w-36 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-anton text-2xl text-white">{(event.subtitle ?? "").split(" ").pop()}</span>
            </div>}
      </div>

      <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white max-w-full md:max-w-[55%]">
        <div className="mb-4">
          {isLive
            ? <LiveBadge />
            : <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">Next Game</p>}
        </div>
        <h2 className="font-anton text-3xl md:text-5xl leading-tight">{event.title}</h2>
        <p className="mt-2 font-lato text-base text-white/70">{formatDate(event.startAt)}</p>
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          className="mt-6 self-start rounded-2xl bg-primary px-6 py-3 font-lato font-bold text-secondary lift-on-hover"
        >
          {isLive ? "Open prediction room →" : "Reserve your spot →"}
        </button>
      </div>
    </section>
  );
}

function EventGridCard({ event, className = "" }: { event: UnifiedEvent; className?: string }) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;
  const tipoffMs = new Date(event.startAt).getTime();
  const isFinal = tipoffMs < Date.now() - 3 * 60 * 60 * 1000 && !isLive;
  const day = new Date(event.startAt).toLocaleDateString("en-US", { day: "2-digit" });
  const month = new Date(event.startAt).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const opponentLogo = event.subtitle ? NBA_LOGOS[event.subtitle] ?? null : null;

  return (
    <button
      type="button"
      onClick={() => {
        if (event.type === "game") navigate("/rooms/create", { state: { eventId: event.id } });
      }}
      className={`group relative block w-full aspect-[4/5] rounded-3xl overflow-hidden bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      aria-label={event.title}
    >
      {event.type === "game" ? (
        <div
          className="absolute inset-0 flex items-center justify-center gap-3"
          style={{ backgroundImage: "radial-gradient(ellipse at 50% 40%, #1a3a6e 0%, #060e1e 100%)" }}
        >
          <img src={WARRIORS_LOGO} alt="GSW" className="h-14 w-14 object-contain opacity-50" />
          <span className="font-anton text-xl text-white/30">{event.meta.isHome ? "vs" : "@"}</span>
          {opponentLogo
            ? <img src={opponentLogo} alt={event.subtitle ?? ""} className="h-14 w-14 object-contain opacity-50" />
            : <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
                <span className="font-anton text-xs text-white">{(event.subtitle ?? "").split(" ").pop()}</span>
              </div>}
        </div>
      ) : event.imageUrl ? (
        <img src={event.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top image-zoom" />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
      {isLive && <div className="absolute inset-0 bg-gradient-to-t from-live/40 via-transparent to-transparent pointer-events-none" />}

      <div className="absolute top-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-center min-w-[3.5rem]">
        <p className="font-anton text-xl text-secondary leading-none tabular-nums">{day}</p>
        <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.12em] text-text-light">{month}</p>
      </div>

      {isLive && <div className="absolute top-4 right-4"><LiveBadge /></div>}
      {isFinal && (
        <div className="absolute top-4 right-4">
          <span className="rounded-md bg-white/95 px-2 py-1 font-lato text-[0.62rem] font-bold uppercase tracking-[0.16em] text-secondary">
            Final
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="font-anton text-xl leading-tight">{event.title}</h3>
        {event.subtitle && <p className="mt-1 font-lato text-sm text-white/60">{event.subtitle}</p>}
      </div>
    </button>
  );
}

function EventGroup({ title, events }: { title: string; events: UnifiedEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section className="mt-16 md:mt-20">
      <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light mb-4 md:mb-6">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, i) => (
          <EventGridCard key={event.id} event={event} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`} />
        ))}
      </div>
    </section>
  );
}

function EventsSkeleton() {
  return (
    <>
      <div className="rounded-3xl aspect-[4/5] md:aspect-[21/9] skeleton-shimmer" />
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`aspect-[4/5] rounded-3xl skeleton-shimmer fade-in-up stagger-${Math.min(i + 1, 6)}`} />
        ))}
      </div>
    </>
  );
}

export default function Events() {
  const { events, loading, error } = useEventsFeed({ limit: 50, pollMs: 5 * 60_000 });

  const now = Date.now();
  const DAY = 86_400_000;
  const futureEvents = events.filter(e => new Date(e.startAt).getTime() >= now - 3 * 60 * 60 * 1000);
  const nextGame = futureEvents.find(e => e.type === "game") ?? futureEvents[0];
  const groups = {
    thisWeek:  futureEvents.filter(e => { const d = new Date(e.startAt).getTime() - now; return d >= 0 && d < 7 * DAY; }),
    thisMonth: futureEvents.filter(e => { const d = new Date(e.startAt).getTime() - now; return d >= 7 * DAY && d < 30 * DAY; }),
    later:     futureEvents.filter(e => new Date(e.startAt).getTime() - now >= 30 * DAY),
  };
  const allEmpty = !groups.thisWeek.length && !groups.thisMonth.length && !groups.later.length;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        <header className="mb-6 md:mb-8 fade-in-up stagger-1">
          <h1 className="font-anton text-4xl md:text-5xl text-secondary leading-tight">Events</h1>
          <p className="mt-2 font-lato text-base text-text-light">Games, watch parties, and fan moments.</p>
        </header>

        {loading && <EventsSkeleton />}

        {!loading && error && (
          <EmptyState message="Couldn't load the schedule." cta={{ label: "Try again", onClick: () => window.location.reload() }} />
        )}

        {!loading && !error && (
          <>
            {nextGame && (
              <div className="fade-in-up stagger-2">
                <NextGameHero event={nextGame} />
              </div>
            )}
            {allEmpty
              ? <div className="mt-16"><EmptyState message="The schedule is clear. New games drop weekly." /></div>
              : <>
                  <EventGroup title="This Week" events={groups.thisWeek} />
                  <EventGroup title="This Month" events={groups.thisMonth} />
                  <EventGroup title="Later" events={groups.later} />
                </>}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
