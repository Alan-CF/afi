import { useNavigate } from "react-router-dom";
import type { UnifiedEvent } from "../../hooks/events";
import EventFallbackVisual from "./EventFallbackVisual";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FanEventCard({ event }: { event: UnifiedEvent }) {
  const navigate = useNavigate();
  const goingCount = event.meta.goingCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/events")}
      className="group relative block w-full overflow-hidden rounded-3xl aspect-[4/5] bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={event.title}
    >
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover image-zoom"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <EventFallbackVisual />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="relative h-full flex flex-col justify-end p-5 md:p-6 text-white">
        <p className="font-lato text-[0.625rem] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          Fan Event
        </p>
        <h3 className="font-anton text-xl md:text-2xl leading-tight line-clamp-2">
          {event.title}
        </h3>
        <p className="mt-2 font-lato text-sm text-white/65">
          {formatDate(event.startAt)}
        </p>
        {event.subtitle && (
          <p className="mt-1 font-lato text-xs text-white/45 line-clamp-1">
            {event.subtitle}
          </p>
        )}
        {goingCount > 0 && (
          <p className="mt-2 font-lato text-xs text-white/55 tabular-nums">
            {goingCount} going
          </p>
        )}
      </div>
    </button>
  );
}
