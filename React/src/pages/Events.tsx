import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/solid';
import ScoreboardRibbon from '../components/layout/ScoreboardRibbon';
import { useEventsFeed } from '../hooks/useEventsFeed';
import type { UnifiedEvent } from '../hooks/events';
import EmptyState from '../components/common/EmptyState';
import GameScheduleCard from '../components/home/GameScheduleCard';
import FanEventCard from '../components/home/FanEventCard';
import { useProfile } from '../hooks/useProfile';

const MOBILE_PAGE_SIZE = 2;

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

function useIsMobileNarrow(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 639px)');
    setIsMobile(query.matches);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

interface SectionGridProps {
  events: UnifiedEvent[];
  isMobile: boolean;
  layout: 'game' | 'fan';
  emptyMessage: string;
  seeAllPath: string;
  pageSize?: number;
}

function SectionGrid({
  events,
  isMobile,
  layout,
  emptyMessage,
  seeAllPath,
  pageSize = MOBILE_PAGE_SIZE,
}: SectionGridProps) {
  if (events.length === 0) {
    return <EmptyState message={emptyMessage} variant="compact" />;
  }
  const shown = isMobile ? events.slice(0, pageSize) : events;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        {shown.map((event, i) => (
          <div
            key={event.id}
            className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}
          >
            {layout === 'game' ? (
              <GameScheduleCard event={event} />
            ) : (
              <FanEventCard event={event} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Link
          to={seeAllPath}
          className="font-lato text-sm font-bold text-secondary transition-colors hover:text-[#172b5b]"
        >
          See all
        </Link>
      </div>
    </div>
  );
}

export default function Events() {
  const { events, loading, error } = useEventsFeed({
    limit: 60,
    pollMs: 5 * 60_000,
  });
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;
  const isMobile = useIsMobileNarrow();

  const now = Date.now();
  const future = events.filter(
    (e) => new Date(e.startAt).getTime() >= now - 3 * 60 * 60 * 1000
  );

  const games = useMemo(
    () =>
      future
        .filter((e) => e.type === 'game')
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        .slice(0, 12),
    [future]
  );

  const fanEvents = useMemo(
    () =>
      future
        .filter((e) => e.type === 'fan')
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        .slice(0, 12),
    [future]
  );

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        {loading && <Skeleton />}

        {!loading && error && (
          <EmptyState
            message="Couldn't load the schedule."
            cta={{
              label: 'Try again',
              onClick: () => window.location.reload(),
            }}
          />
        )}

        {!loading && !error && (
          <>
            <section className="mt-2">
              <header className="mb-4 md:mb-5">
                <div className="h-1 w-10 rounded-full bg-primary" />
                <h2 className="mt-2 font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
                  Warriors Games
                </h2>
                <p className="mt-1 font-lato text-xs md:text-sm font-bold text-[#475569]">
                  Upcoming matchups and watch rooms.
                </p>
              </header>
              <SectionGrid
                events={games}
                isMobile={isMobile}
                layout="game"
                emptyMessage="No games on the calendar right now."
                seeAllPath="/events/games/previous"
              />
            </section>

            <section className="mt-10 md:mt-12 lg:mt-14">
              <header className="mb-4 md:mb-5">
                <div className="h-1 w-10 rounded-full bg-primary" />
                <h2 className="mt-2 font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
                  Fan Events
                </h2>
                <p className="mt-1 font-lato text-xs md:text-sm font-bold text-[#475569]">
                  Watch parties, meetups, and fan-run moments.
                </p>
              </header>

              <SectionGrid
                events={fanEvents}
                isMobile={isMobile}
                layout="fan"
                emptyMessage="No fan events on the calendar right now."
                seeAllPath="/events/fan/previous"
              />
            </section>

            {isLoggedIn && (
              <section className="mt-10 md:mt-12 lg:mt-14">
                <div className="flex flex-col items-start gap-3 rounded-3xl border border-container-border bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <div className="h-1 w-10 rounded-full bg-primary" />
                    <p className="mt-2 font-anton text-lg text-secondary sm:text-xl">
                      Hosting a watch party or fan meetup?
                    </p>
                    <p className="mt-1 font-lato text-xs font-bold text-[#475569] sm:text-sm">
                      Share your event with Dub Nation in a few clicks.
                    </p>
                  </div>
                  <Link
                    to="/events/create"
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] sm:w-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Host Fan Event
                  </Link>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
