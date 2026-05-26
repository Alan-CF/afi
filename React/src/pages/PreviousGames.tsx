import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import GameScheduleCard from "../components/home/GameScheduleCard";
import EmptyState from "../components/common/EmptyState";
import EventsFilterBar, {
  type EventsView,
  type FanEventsSortMode,
  type ViewOption,
} from "../components/events/EventsFilterBar";
import type { UnifiedEvent } from "../hooks/events";
import {
  listWarriorsGameDetails,
  listWarriorsGameDetailsPast,
  type WarriorsGameDetail,
} from "../lib/warriorsGameDetails";
import { listAttendingSeedIds } from "../hooks/useSeedAttendance";
import { useProfile } from "../hooks/useProfile";

function gameToUnified(game: WarriorsGameDetail): UnifiedEvent {
  const hasFinal =
    typeof game.finalWarriorsScore === "number" &&
    typeof game.finalOpponentScore === "number";
  return {
    id: game.id,
    type: "game",
    title: game.matchup,
    subtitle: game.opponentName,
    startAt: game.startAt,
    venue: game.venue,
    imageUrl: null,
    meta: {
      isHome: game.isHome,
      isLive: false,
      isFinal: !!game.isPast,
      warriorsScore: hasFinal ? (game.finalWarriorsScore as number) : null,
      opponentScore: hasFinal ? (game.finalOpponentScore as number) : null,
      status: game.isPast ? "post" : "pre",
      statusDetail: game.isPast ? "Final" : undefined,
      warriorsLogo: game.warriorsLogo,
      opponentLogo: game.opponentLogo,
      opponentAbbr: game.opponentAbbr,
      opponentName: game.opponentName,
      broadcast: game.broadcast,
      goingCount: game.attendees.length,
    },
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

export default function PreviousGames() {
  const navigate = useNavigate();
  const { user } = useProfile();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<FanEventsSortMode>("upcoming");
  const [view, setView] = useState<EventsView>("all");
  const [attendingSeedIds, setAttendingSeedIds] = useState<Set<string>>(
    () => listAttendingSeedIds()
  );

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

  const all = useMemo(
    () => [
      ...listWarriorsGameDetails().map(gameToUnified),
      ...listWarriorsGameDetailsPast().map(gameToUnified),
    ],
    []
  );

  const viewFiltered = useMemo(() => {
    if (view === "attending")
      return all.filter((event) => attendingSeedIds.has(event.id));
    return all;
  }, [all, view, attendingSeedIds]);

  const filtered = useMemo(
    () => viewFiltered.filter((event) => queryMatches(event, query)),
    [viewFiltered, query]
  );

  const games = useMemo(
    () => sortEvents(filtered, sort, Date.now()),
    [filtered, sort]
  );

  const viewOptions: ViewOption[] = user
    ? [
        { value: "all", label: "All" },
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
            All Warriors Games
          </h1>
          <p className="mt-1 font-lato text-xs md:text-sm font-bold text-[#475569]">
            Every upcoming matchup and the latest results.
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
          {games.length === 0 ? (
            <EmptyState
              variant="compact"
              message={
                view === "attending"
                  ? "You're not attending any games yet."
                  : "No games match your search."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
              {games.map((event, i) => (
                <div
                  key={event.id}
                  className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <GameScheduleCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
