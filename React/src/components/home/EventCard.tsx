import { useNavigate } from "react-router-dom";
import { setFanEventAttendance } from "../../hooks/fanEvents";
import type { UnifiedEvent } from "../../hooks/events";
import GameEventFallback from "./GameEventFallback";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export default function EventCard({ event }: { event: UnifiedEvent }) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;

  function handleClick() {
    if (event.type === "game") {
      navigate("/rooms/create", { state: { eventId: event.id } });
    } else if (event.type === "fan" && event.meta.fanEventId) {
      void setFanEventAttendance(event.meta.fanEventId, "going");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative shrink-0 w-[280px] h-[320px] overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lift-on-hover"
      aria-label={event.title}
    >
      {event.type === "game" ? (
        <GameEventFallback
          opponent={event.subtitle ?? ""}
          isHome={event.meta.isHome ?? true}
          isLive={isLive}
          size="rail"
        />
      ) : event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover image-zoom"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden">
          <span className="font-anton text-[8rem] text-primary opacity-[0.15] select-none leading-none" aria-hidden>W</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {isLive && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-live px-2 py-1 font-lato text-[0.6rem] font-black uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Live
        </span>
      )}

      {event.type === "game" && event.meta.warriorsScore != null && event.meta.opponentScore != null && (
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1">
          <span className="font-lato text-sm font-bold text-white tabular-nums">
            {event.meta.warriorsScore} – {event.meta.opponentScore}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-lato text-xs uppercase tracking-wider text-white/55 mb-1">
          {formatDate(event.startAt)}
        </p>
        <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">
          {event.title}
        </h3>
      </div>
    </button>
  );
}
