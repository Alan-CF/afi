import { useState } from "react";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import EventCard from "../components/home/EventCard";
import EventsFilters, { type EventsFilterState } from "../components/events/EventsFilters";
import { useEventsFeed } from "../hooks/useEventsFeed";

export default function Events() {
  const [filterState, setFilterState] = useState<EventsFilterState>({
    types: ["game", "fan"],
  });

  const { events, loading, error } = useEventsFeed({
    limit: 50,
    types: filterState.types,
    pollMs: 5 * 60_000,
  });

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-8">
          <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">
            Everything happening
          </p>
          <h1 className="font-anton text-4xl text-secondary md:text-5xl">All Events</h1>
          <p className="mt-3 max-w-2xl font-lato text-text-light">
            Warriors games and fan meetups — all in one feed.
          </p>
        </header>

        <EventsFilters value={filterState} onChange={setFilterState} />

        {loading && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-gray-100" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="mt-6 font-lato text-destructive">Could not load events.</p>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="font-lato text-text-light">No events match your filters.</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
