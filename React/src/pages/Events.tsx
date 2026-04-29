import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useEventsFeed } from "../hooks/useEventsFeed";
import type { UnifiedEvent } from "../hooks/events";
import EmptyState from "../components/common/EmptyState";
import GameScheduleCard from "../components/home/GameScheduleCard";
import FanEventCard from "../components/home/FanEventCard";

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`h-[280px] rounded-3xl skeleton-shimmer fade-in-up stagger-${Math.min(i + 1, 6)}`}
        />
      ))}
    </div>
  );
}

function EventGroup({
  kicker,
  title,
  subtitle,
  events,
  layout,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  events: UnifiedEvent[];
  layout: "game" | "fan";
}) {
  if (events.length === 0) return null;
  return (
    <section className="mt-8 md:mt-10 first-of-type:mt-6 first-of-type:md:mt-8">
      <header className="mb-5 md:mb-6">
        <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-text-light">
          {kicker}
        </p>
        <h2 className="mt-2 font-anton text-2xl md:text-3xl text-secondary leading-tight">{title}</h2>
        {subtitle && <p className="mt-1 font-lato text-sm text-text-light">{subtitle}</p>}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        {events.map((event, i) => (
          <div key={event.id} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}>
            {layout === "game" ? (
              <GameScheduleCard event={event} />
            ) : (
              <FanEventCard event={event} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Events() {
  const { events, loading, error } = useEventsFeed({ limit: 50, pollMs: 5 * 60_000 });

  const now = Date.now();
  const future = events.filter(
    (e) => new Date(e.startAt).getTime() >= now - 3 * 60 * 60 * 1000
  );

  const games = future.filter((e) => e.type === "game").slice(0, 12);
  const fanEvents = future.filter((e) => e.type === "fan").slice(0, 12);

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        <header className="mb-2 md:mb-3 fade-in-up stagger-1">
          <h1 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">Events</h1>
          <p className="mt-2 font-lato text-sm md:text-base text-text-light">
            Games, watch parties, and fan moments.
          </p>
        </header>

        {loading && <Skeleton />}

        {!loading && error && (
          <EmptyState
            message="Couldn't load the schedule."
            cta={{ label: "Try again", onClick: () => window.location.reload() }}
          />
        )}

        {!loading && !error && games.length === 0 && fanEvents.length === 0 && (
          <EmptyState message="The schedule is clear. New games drop weekly." />
        )}

        {!loading && !error && (games.length > 0 || fanEvents.length > 0) && (
          <>
            <EventGroup
              kicker="Schedule"
              title="Warriors Games"
              subtitle="Upcoming matchups for the next 30 days."
              events={games}
              layout="game"
            />
            <EventGroup
              kicker="What's on"
              title="Fan Events"
              subtitle="Watch parties, meetups, and fan-run moments."
              events={fanEvents}
              layout="fan"
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
