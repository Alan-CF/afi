import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import FanEventCard from "../components/home/FanEventCard";
import EmptyState from "../components/common/EmptyState";
import EventsFilterBar, {
  type EventsView,
  type FanEventsSortMode,
  type ViewOption,
} from "../components/events/EventsFilterBar";
import type { UnifiedEvent } from "../hooks/events";
import {
  listSeedFanEventDetails,
  type SeedFanEventDetail,
} from "../lib/seedFanEventDetails";
import {
  fetchAllPublicFanEvents,
  type FanEvent,
} from "../hooks/fanEvents";
import { fetchMyAttendingEventIds } from "../lib/eventsApi";
import { listAttendingSeedIds } from "../hooks/useSeedAttendance";
import { useProfile } from "../hooks/useProfile";

function seedToUnified(seed: SeedFanEventDetail): UnifiedEvent {
  return {
    id: seed.id,
    type: "fan",
    title: seed.title,
    subtitle: [seed.venue, seed.city].filter(Boolean).join(", "),
    startAt: seed.startAt,
    venue: seed.venue,
    imageUrl: seed.coverImageUrl,
    tags: seed.tags,
    meta: {
      goingCount: seed.attendees.length,
    },
  };
}

function dbToUnified(event: FanEvent): UnifiedEvent {
  return {
    id: `fan-${event.id}`,
    type: "fan",
    title: event.title,
    subtitle: [event.venue, event.city].filter(Boolean).join(", "),
    startAt: event.startAt,
    venue: event.venue,
    imageUrl: event.imageUrl,
    tags: event.tags,
    meta: { goingCount: event.goingCount, fanEventId: event.id },
  };
}

function queryMatches(event: UnifiedEvent, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = [event.title, event.subtitle ?? "", event.venue ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(trimmed);
}

function sortEvents(
  events: UnifiedEvent[],
  mode: FanEventsSortMode,
  now: number
): UnifiedEvent[] {
  const next = [...events];
  if (mode === "popular") {
    next.sort((a, b) => (b.meta.goingCount ?? 0) - (a.meta.goingCount ?? 0));
    return next;
  }
  if (mode === "newest") {
    next.sort(
      (a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );
    return next;
  }
  if (mode === "alpha") {
    next.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
    return next;
  }
  next.sort((a, b) => {
    const aT = new Date(a.startAt).getTime();
    const bT = new Date(b.startAt).getTime();
    const aFuture = aT >= now;
    const bFuture = bT >= now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    if (aFuture) return aT - bT;
    return bT - aT;
  });
  return next;
}

export default function PreviousFanEvents() {
  const navigate = useNavigate();
  const { user, hasLoadedOnce } = useProfile();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<FanEventsSortMode>("upcoming");
  const [view, setView] = useState<EventsView>("all");

  const [dbEvents, setDbEvents] = useState<FanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendingDbIds, setAttendingDbIds] = useState<Set<number>>(
    () => new Set()
  );
  const [attendingSeedIds, setAttendingSeedIds] = useState<Set<string>>(
    () => listAttendingSeedIds()
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllPublicFanEvents(60)
      .then((rows) => {
        if (!cancelled) setDbEvents(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAttendingDbIds(new Set());
      return;
    }
    let cancelled = false;
    fetchMyAttendingEventIds(user.id).then((ids) => {
      if (!cancelled) setAttendingDbIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    function refresh() {
      setAttendingSeedIds(listAttendingSeedIds());
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const ownedIds = useMemo(() => {
    if (!user) return new Set<string>();
    const owned = new Set<string>();
    for (const event of dbEvents) {
      if (event.organizerProfileId === user.id) {
        owned.add(`fan-${event.id}`);
      }
    }
    return owned;
  }, [dbEvents, user]);

  const attendingIds = useMemo(() => {
    const set = new Set<string>();
    for (const id of attendingDbIds) set.add(`fan-${id}`);
    for (const id of attendingSeedIds) set.add(id);
    return set;
  }, [attendingDbIds, attendingSeedIds]);

  const all = useMemo(() => {
    const dbIds = new Set(dbEvents.map((e) => `fan-${e.id}`));
    const seed = listSeedFanEventDetails()
      .map(seedToUnified)
      .filter((e) => !dbIds.has(e.id));
    return [...dbEvents.map(dbToUnified), ...seed];
  }, [dbEvents]);

  const viewFiltered = useMemo(() => {
    if (view === "mine") return all.filter((event) => ownedIds.has(event.id));
    if (view === "attending")
      return all.filter((event) => attendingIds.has(event.id));
    return all;
  }, [all, view, ownedIds, attendingIds]);

  const filtered = useMemo(
    () => viewFiltered.filter((event) => queryMatches(event, query)),
    [viewFiltered, query]
  );

  const events = useMemo(
    () => sortEvents(filtered, sort, Date.now()),
    [filtered, sort]
  );

  const showFullViewOptions = !hasLoadedOnce || !!user;
  const viewOptions: ViewOption[] = showFullViewOptions
    ? [
        { value: "all", label: "All" },
        { value: "mine", label: "My events" },
        { value: "attending", label: "Attending" },
      ]
    : [{ value: "all", label: "All" }];

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 font-lato text-xs font-bold text-secondary shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition-colors hover:bg-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to events
        </button>

        <header className="mb-5 md:mb-6">
          <div className="h-1 w-10 rounded-full bg-primary" />
          <h1 className="mt-2 font-anton text-2xl md:text-3xl text-secondary leading-tight">
            All Fan Events
          </h1>
          <p className="mt-1 font-lato text-xs md:text-sm font-bold text-[#475569]">
            Every fan event, including the ones hosted by Dub Nation.
          </p>
        </header>

        <EventsFilterBar
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
          viewOptions={viewOptions}
        />

        <div className="mt-5 md:mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[280px] rounded-3xl skeleton-shimmer fade-in-up stagger-${Math.min(i + 1, 6)}`}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              variant="compact"
              message={
                view === "mine"
                  ? "You haven't hosted any fan events yet."
                  : view === "attending"
                  ? "You're not attending any fan events yet."
                  : "No fan events match your search."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
              {events.map((event, i) => (
                <div
                  key={event.id}
                  className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <FanEventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
