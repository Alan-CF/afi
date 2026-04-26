import { useNavigate } from "react-router-dom";
import { useEventsFeed } from "../../hooks/useEventsFeed";
import EmptyState from "../common/EmptyState";
import GameScheduleCard from "./GameScheduleCard";
import FanEventCard from "./FanEventCard";
import type { UnifiedEvent } from "../../hooks/events";

function renderEvent(event: UnifiedEvent) {
  return event.type === "game"
    ? <GameScheduleCard event={event} />
    : <FanEventCard event={event} />;
}

export default function HomeEventsSection() {
  const navigate = useNavigate();
  const { events, loading } = useEventsFeed({ limit: 6, pollMs: 60_000 });

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
          Upcoming Events
        </h2>
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
        >
          See all →
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-3xl h-[280px] skeleton-shimmer fade-in-up stagger-${i + 1}`}
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState message="No games on the calendar. The Warriors will be back." />
      ) : events.length === 1 ? (
        <div className="fade-in-up stagger-1">{renderEvent(events[0])}</div>
      ) : events.length === 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event, i) => (
            <div key={event.id} className={`fade-in-up stagger-${i + 1}`}>
              {renderEvent(event)}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-3 gap-4">
            {events.slice(0, 3).map((event, i) => (
              <div key={event.id} className={`fade-in-up stagger-${i + 1}`}>
                {renderEvent(event)}
              </div>
            ))}
          </div>
          <div className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-1">
            {events.map((event, i) => (
              <div
                key={event.id}
                className={`snap-start shrink-0 w-[280px] fade-in-up stagger-${Math.min(i + 1, 6)}`}
              >
                {renderEvent(event)}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
