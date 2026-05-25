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
import EventsFilterBar, {
  type FanEventsSortMode,
} from '../components/events/EventsFilterBar';

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

function sortEvents(
  events: UnifiedEvent[],
  mode: FanEventsSortMode
): UnifiedEvent[] {
  const next = [...events];
  if (mode === 'popular') {
    next.sort((a, b) => (b.meta.goingCount ?? 0) - (a.meta.goingCount ?? 0));
    return next;
  }
  if (mode === 'recent') {
    next.sort((a, b) => {
      const aIsDb = a.id.startsWith('fan-');
      const bIsDb = b.id.startsWith('fan-');
      if (aIsDb !== bIsDb) return aIsDb ? -1 : 1;
      if (aIsDb && bIsDb) {
        const aId = Number.parseInt(a.id.slice(4), 10);
        const bId = Number.parseInt(b.id.slice(4), 10);
        if (Number.isFinite(aId) && Number.isFinite(bId)) {
          return bId - aId;
        }
      }
      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
    });
    return next;
  }
  next.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  return next;
}

function queryMatches(event: UnifiedEvent, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = [event.title, event.subtitle ?? '', event.venue ?? '']
    .join(' ')
    .toLowerCase();
  return haystack.includes(trimmed);
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

interface ProgressiveGridProps {
  events: UnifiedEvent[];
  isMobile: boolean;
  layout: 'game' | 'fan';
  emptyMessage: string;
  pageSize?: number;
}

function ProgressiveGrid({
  events,
  isMobile,
  layout,
  emptyMessage,
  pageSize = MOBILE_PAGE_SIZE,
}: ProgressiveGridProps) {
  const [visible, setVisible] = useState(pageSize);

  useEffect(() => {
    setVisible(pageSize);
  }, [events.length, pageSize, isMobile]);

  if (events.length === 0) {
    return <EmptyState message={emptyMessage} variant="compact" />;
  }

  const shown = isMobile ? events.slice(0, visible) : events;
  const remaining = isMobile ? events.length - shown.length : 0;

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
      {remaining > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisible((current) =>
                Math.min(current + pageSize, events.length)
              )
            }
            className="inline-flex items-center justify-center rounded-2xl border-2 border-secondary px-5 py-2.5 font-lato text-sm font-bold text-secondary transition-colors hover:bg-secondary hover:text-white"
          >
            Show more ({remaining} left)
          </button>
        </div>
      )}
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

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<FanEventsSortMode>('upcoming');

  const now = Date.now();
  const future = events.filter(
    (e) => new Date(e.startAt).getTime() >= now - 3 * 60 * 60 * 1000
  );

  const games = useMemo(
    () => future.filter((e) => e.type === 'game').slice(0, 12),
    [future]
  );

  const fanEventsFiltered = useMemo(
    () =>
      future
        .filter((e) => e.type === 'fan')
        .filter((e) => queryMatches(e, query)),
    [future, query]
  );
  const fanEvents = useMemo(
    () => sortEvents(fanEventsFiltered, sort),
    [fanEventsFiltered, sort]
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
                <h2 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
                  Warriors Games
                </h2>
              </header>
              <ProgressiveGrid
                events={games}
                isMobile={isMobile}
                layout="game"
                emptyMessage="No games on the calendar right now."
              />
            </section>

            <section className="mt-10 md:mt-12 lg:mt-14">
              <header className="mb-4 md:mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
                  Fan Events
                </h2>
                {isLoggedIn && (
                  <Link
                    to="/events/create"
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 font-lato text-sm font-bold text-secondary transition-colors hover:bg-[#f3b91d] sm:w-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Host Fan Event
                  </Link>
                )}
              </header>

              <EventsFilterBar
                query={query}
                onQueryChange={setQuery}
                sort={sort}
                onSortChange={setSort}
              />

              <div className="mt-5 md:mt-6">
                <ProgressiveGrid
                  events={fanEvents}
                  isMobile={isMobile}
                  layout="fan"
                  emptyMessage="No fan events match your search."
                />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
