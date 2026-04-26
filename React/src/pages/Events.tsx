import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useEventsFeed } from "../hooks/useEventsFeed";
import type { UnifiedEvent } from "../hooks/events";
import EmptyState from "../components/common/EmptyState";
import GameScheduleCard from "../components/home/GameScheduleCard";
import FanEventCard from "../components/home/FanEventCard";

function renderEvent(event: UnifiedEvent) {
  return event.type === "game"
    ? <GameScheduleCard event={event} />
    : <FanEventCard event={event} />;
}

function EventsSkeleton() {
  return (
    <>
      <div className="rounded-3xl h-[280px] md:h-[300px] skeleton-shimmer" />
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-[300px] rounded-3xl skeleton-shimmer fade-in-up stagger-${Math.min(i + 1, 6)}`} />
        ))}
      </div>
    </>
  );
}

function EventGroup({ title, events }: { title: string; events: UnifiedEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section className="mt-16 md:mt-20">
      <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light mb-4 md:mb-6">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {events.map((event, i) => (
          <div key={event.id} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}>
            {renderEvent(event)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Events() {
  const { events, loading, error } = useEventsFeed({ limit: 50, pollMs: 5 * 60_000 });

  const now = Date.now();
  const DAY = 86_400_000;
  const futureEvents = events.filter(
    (e) => new Date(e.startAt).getTime() >= now - 3 * 60 * 60 * 1000
  );
  const featured = futureEvents[0] ?? null;
  const rest = featured ? futureEvents.slice(1) : [];

  const groups = {
    thisWeek: rest.filter((e) => {
      const d = new Date(e.startAt).getTime() - now;
      return d >= 0 && d < 7 * DAY;
    }),
    thisMonth: rest.filter((e) => {
      const d = new Date(e.startAt).getTime() - now;
      return d >= 7 * DAY && d < 30 * DAY;
    }),
    later: rest.filter((e) => new Date(e.startAt).getTime() - now >= 30 * DAY),
  };
  const allEmpty =
    !groups.thisWeek.length && !groups.thisMonth.length && !groups.later.length;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        <header className="mb-6 md:mb-8 fade-in-up stagger-1">
          <h1 className="font-anton text-4xl md:text-5xl text-secondary leading-tight">Events</h1>
          <p className="mt-2 font-lato text-base text-text-light">
            Games, watch parties, and fan moments.
          </p>
        </header>

        {loading && <EventsSkeleton />}

        {!loading && error && (
          <EmptyState
            message="Couldn't load the schedule."
            cta={{ label: "Try again", onClick: () => window.location.reload() }}
          />
        )}

        {!loading && !error && !featured && (
          <EmptyState message="The schedule is clear. New games drop weekly." />
        )}

        {!loading && !error && featured && (
          <>
            <div className="fade-in-up stagger-2">{renderEvent(featured)}</div>
            {allEmpty ? (
              <div className="mt-16">
                <EmptyState message="No more events on the calendar yet. Check back soon." />
              </div>
            ) : (
              <>
                <EventGroup title="This Week" events={groups.thisWeek} />
                <EventGroup title="This Month" events={groups.thisMonth} />
                <EventGroup title="Later" events={groups.later} />
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
