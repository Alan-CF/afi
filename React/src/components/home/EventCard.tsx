import { useNavigate } from "react-router-dom";
import { setFanEventAttendance } from "../../hooks/fanEvents";
import type { UnifiedEvent } from "../../hooks/events";

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
    } else if (event.type === "fan") {
      if (event.meta.fanEventId) {
        void setFanEventAttendance(event.meta.fanEventId, "going");
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex-shrink-0 w-[280px] h-[320px] overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={event.title}
    >
      {event.type === "game" ? (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center gap-4">
          {event.meta.warriorsLogo && (
            <img src={event.meta.warriorsLogo} alt="Warriors" className="h-20 w-20 object-contain" />
          )}
          <span className="font-anton text-3xl text-white/60">
            {event.meta.isHome ? "vs" : "@"}
          </span>
          {event.meta.opponentLogo && (
            <img src={event.meta.opponentLogo} alt={event.meta.opponentAbbr} className="h-20 w-20 object-contain" />
          )}
        </div>
      ) : event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {isLive && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-destructive px-2 py-1 font-lato text-[0.6rem] font-black uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          live
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-lato text-xs uppercase tracking-wider text-white/60 mb-1">
          {formatDate(event.startAt)}
        </p>
        <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">
          {event.title}
        </h3>
      </div>
    </button>
  );
}
