import Rail from "./Rail";
import EventCard from "./EventCard";
import { useEventsFeed } from "../../hooks/useEventsFeed";

export default function EventsSlider() {
  const { events, loading } = useEventsFeed({ limit: 6 });

  if (loading) {
    return (
      <Rail title="Upcoming Events" seeAllTo="/events">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="snap-start shrink-0 w-[280px] h-[320px] animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </Rail>
    );
  }

  if (events.length === 0) {
    return (
      <Rail title="Upcoming Events" seeAllTo="/events">
        <div className="w-full h-[320px] rounded-2xl bg-gray-100 flex items-center justify-center">
          <p className="font-lato text-sm text-text-light">No upcoming events</p>
        </div>
      </Rail>
    );
  }

  return (
    <Rail title="Upcoming Events" seeAllTo="/events">
      {events.map((event) => (
        <div key={event.id} className="snap-start shrink-0">
          <EventCard event={event} />
        </div>
      ))}
    </Rail>
  );
}
