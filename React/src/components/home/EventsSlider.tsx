import { useNavigate } from "react-router-dom";
import EventCard from "./EventCard";
import { useEventsFeed } from "../../hooks/useEventsFeed";

export default function EventsSlider() {
  const navigate = useNavigate();
  const { events, loading } = useEventsFeed({ limit: 6 });

  return (
    <section aria-label="Upcoming events">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary lowercase tracking-tight">
          events
        </h2>
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="font-anton text-xl text-secondary hover:text-primary transition-colors"
          aria-label="See all events"
        >
          →
        </button>
      </div>

      {loading && (
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] h-[320px] animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="h-[320px] rounded-2xl bg-gray-100 flex items-center justify-center">
          <p className="font-lato text-sm text-text-light">No upcoming events</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="-mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {events.map((event) => (
              <div key={event.id} className="snap-start">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
