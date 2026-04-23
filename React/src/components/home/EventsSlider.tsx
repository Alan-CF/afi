import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import EventCard from "./EventCard";
import { useEventsFeed } from "../../hooks/useEventsFeed";
import type { EventType } from "../../hooks/events";

const FILTERS: Array<{ key: "all" | EventType; label: string }> = [
  { key: "all",  label: "All" },
  { key: "game", label: "Games" },
  { key: "fan",  label: "Fan" },
];

export default function EventsSlider() {
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const navigate = useNavigate();
  const types = filter === "all" ? undefined : [filter];
  const { events, loading, error } = useEventsFeed({ limit: 4, types });

  return (
    <section
      aria-labelledby="events-title"
      className="rounded-3xl border-2 border-gray-100 bg-white p-4 sm:p-6 shadow-sm"
    >
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">
            What's next
          </p>
          <h2 id="events-title" className="font-anton text-3xl text-secondary">
            Upcoming Events
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border-2 px-3 py-1 font-lato text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                filter === f.key
                  ? "border-secondary bg-secondary text-white"
                  : "border-gray-200 bg-white text-secondary hover:border-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="font-lato text-sm text-destructive">
          Could not load events. Check your connection and try again.
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="font-lato text-text-light">No upcoming events match this filter.</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:hidden">
            {events.map((event) => (
              <div key={event.id} className="w-[78%] shrink-0 snap-center">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="secondary" onClick={() => navigate("/events")}>
          See all events
        </Button>
      </div>
    </section>
  );
}
