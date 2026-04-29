import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useEventsFeed } from "../../hooks/useEventsFeed";
import EmptyState from "../common/EmptyState";
import GameScheduleCard from "./GameScheduleCard";
import FanEventCard from "./FanEventCard";
import type { UnifiedEvent } from "../../hooks/events";

const CARD_HEIGHT = "h-[280px]";

function RailCard({ event }: { event: UnifiedEvent }) {
  if (event.type === "game") {
    return <GameScheduleCard event={event} className="h-full" />;
  }
  return <FanEventCard event={event} className="h-full" />;
}

export default function HomeEventsSection() {
  const navigate = useNavigate();
  const { events, loading } = useEventsFeed({ limit: 5, pollMs: 60_000 });

  return (
    <section className="relative isolate mt-8 md:mt-10 lg:mt-12">
      <div className="relative z-10 flex items-baseline justify-between mb-4 md:mb-5">
        <Link
          to="/events"
          className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          Upcoming Events
        </Link>
        <Link
          to="/events"
          className="font-lato text-sm font-bold text-text-light hover:text-secondary transition-colors shrink-0"
        >
          See all
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`shrink-0 w-[280px] ${CARD_HEIGHT} rounded-3xl skeleton-shimmer fade-in-up stagger-${i + 1}`}
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState message="No games on the calendar. The Warriors will be back." />
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-proximity scroll-pl-4 md:scroll-pl-6 lg:scroll-pl-8 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
          {events.map((event, i) => (
            <div
              key={event.id}
              className={`snap-start shrink-0 w-[280px] ${CARD_HEIGHT} fade-in-up stagger-${Math.min(i + 1, 6)}`}
            >
              <RailCard event={event} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate("/events")}
            className={`group snap-start shrink-0 w-[200px] ${CARD_HEIGHT} rounded-3xl border-2 border-dashed border-container-border bg-text-light-soft hover:border-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex flex-col items-center justify-center gap-3`}
            aria-label="See all events"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.08] text-secondary group-hover:bg-secondary/15 transition-colors">
              <ArrowRightIcon className="h-5 w-5" />
            </span>
            <span className="font-lato text-sm font-bold text-text-light group-hover:text-secondary transition-colors">
              Show more
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
