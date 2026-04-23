import { useNavigate } from "react-router-dom";
import { MapPinIcon, UsersIcon } from "@heroicons/react/24/solid";
import Button from "../ui/Button";
import { setFanEventAttendance } from "../../hooks/fanEvents";
import type { UnifiedEvent } from "../../hooks/events";

interface Props {
  event: UnifiedEvent;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export default function EventCard({ event }: Props) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-3xl border-2 bg-white p-4 shadow-sm ${
        isLive ? "border-destructive" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 font-lato text-[0.6rem] font-black uppercase tracking-[0.14em] ${
            event.type === "game" ? "bg-secondary text-white" : "bg-primary text-secondary"
          }`}
        >
          {event.type === "game" ? "Game" : "Fan event"}
        </span>
        {isLive && (
          <span className="rounded-full bg-destructive px-2 py-0.5 font-lato text-[0.6rem] font-black uppercase tracking-[0.14em] text-white">
            ● Live
          </span>
        )}
      </div>

      {event.type === "game" ? (
        <div className="flex h-24 items-center justify-center gap-3 rounded-2xl bg-text-light-soft">
          <img src={event.meta.warriorsLogo} alt="Warriors" className="h-16 w-16 object-contain" />
          <span className="font-anton text-2xl text-secondary">
            {event.meta.isHome ? "vs" : "@"}
          </span>
          <img src={event.meta.opponentLogo} alt={event.meta.opponentAbbr} className="h-16 w-16 object-contain" />
        </div>
      ) : event.imageUrl ? (
        <img src={event.imageUrl} alt="" className="h-24 w-full rounded-2xl object-cover" />
      ) : (
        <div className="h-24 rounded-2xl bg-text-light-soft" aria-hidden="true" />
      )}

      <div className="flex flex-col gap-1">
        <p className="font-lato text-xs uppercase tracking-[0.1em] text-text-light">
          {formatDate(event.startAt)} · {formatTime(event.startAt)}
        </p>
        <h3 className="font-anton text-lg text-secondary line-clamp-2">{event.title}</h3>
        {event.subtitle && (
          <p className="flex items-center gap-1 font-lato text-xs text-text-light">
            <MapPinIcon className="h-3 w-3" />
            {event.subtitle}
          </p>
        )}
        {event.type === "fan" && event.meta.goingCount !== undefined && (
          <p className="flex items-center gap-1 font-lato text-xs text-text-light">
            <UsersIcon className="h-3 w-3" />
            {event.meta.goingCount} going
          </p>
        )}
        {event.type === "game" && event.meta.broadcast && (
          <p className="font-lato text-xs text-text-light">📺 {event.meta.broadcast}</p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {event.type === "game" && (
          <>
            <Button variant="primary" className="flex-1 text-sm"
              onClick={() => navigate("/rooms/create", { state: { eventId: event.id } })}>
              Create Room
            </Button>
            <Button variant="secondary" className="flex-1 text-sm"
              onClick={() => navigate("/rooms")}>
              Join
            </Button>
          </>
        )}
        {event.type === "fan" && (
          <>
            <Button variant="primary" className="flex-1 text-sm"
              onClick={() => {
                if (event.meta.fanEventId) {
                  void setFanEventAttendance(event.meta.fanEventId, "going");
                }
              }}>
              Attend
            </Button>
            <Button variant="secondary" className="flex-1 text-sm"
              onClick={() => navigate("/events")}>
              Info
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
