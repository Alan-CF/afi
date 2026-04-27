import { useNavigate } from "react-router-dom";
import type { UnifiedEvent } from "../../hooks/events";
import LiveBadge from "../common/LiveBadge";

const DEFAULT_WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

interface Props {
  event: UnifiedEvent;
  className?: string;
}

export default function GameScheduleCard({ event, className = "" }: Props) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;
  const isFinal = event.meta.isFinal === true;
  const isHome = event.meta.isHome ?? true;
  const hasScore = Number.isFinite(event.meta.warriorsScore) && Number.isFinite(event.meta.opponentScore);
  const won = hasScore && (event.meta.warriorsScore ?? 0) > (event.meta.opponentScore ?? 0);

  const warriorsLogo = event.meta.warriorsLogo ?? DEFAULT_WARRIORS_LOGO;
  const opponentLogo = event.meta.opponentLogo;
  const opponentAbbr = event.meta.opponentAbbr ?? "";
  const opponentName = event.meta.opponentName ?? event.subtitle ?? "";

  const statusLabel = isLive ? "LIVE" : (isFinal && hasScore) ? "FINAL" : "UPCOMING";

  return (
    <button
      type="button"
      onClick={() => navigate(isLive ? "/rooms" : "/events")}
      className={`group relative flex flex-col w-full text-left rounded-3xl bg-white border border-container-border overflow-hidden lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isLive ? "border-l-4 border-l-live" : ""} ${className}`}
      aria-label={event.title}
    >
      <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
        <p className="font-lato text-xs text-text-light tabular-nums">
          {formatDateTime(event.startAt)}
        </p>
        {isLive ? (
          <LiveBadge />
        ) : (
          <span className={`font-lato text-[0.625rem] font-bold uppercase tracking-[0.16em] ${isFinal && hasScore ? "text-text-light" : "text-primary"}`}>
            {statusLabel}
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center gap-4 md:gap-6 px-5 md:px-6 py-6">
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <img
            src={warriorsLogo}
            alt="GSW"
            className="h-14 w-14 md:h-16 md:w-16 object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== DEFAULT_WARRIORS_LOGO) {
                img.src = DEFAULT_WARRIORS_LOGO;
              } else {
                img.style.display = "none";
              }
            }}
          />
          <p className="font-lato text-xs font-bold text-secondary uppercase tracking-wider">GSW</p>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          {hasScore ? (
            <div className="flex items-baseline gap-2 md:gap-3 font-anton text-3xl md:text-4xl tabular-nums">
              <span className={isFinal && !won ? "text-text-light" : "text-secondary"}>
                {event.meta.warriorsScore}
              </span>
              <span className="text-text-light text-xl">–</span>
              <span className={isFinal && won ? "text-text-light" : "text-secondary"}>
                {event.meta.opponentScore}
              </span>
            </div>
          ) : (
            <span className="font-anton text-2xl md:text-3xl text-text-light">
              {isHome ? "vs" : "@"}
            </span>
          )}
          {isFinal && hasScore && (
            <span className={`font-lato text-xs font-black uppercase tracking-wider ${won ? "text-success" : "text-destructive"}`}>
              {won ? "W" : "L"}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          {opponentLogo ? (
            <img
              src={opponentLogo}
              alt={opponentName}
              className="h-14 w-14 md:h-16 md:w-16 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-secondary/10 flex items-center justify-center font-anton text-sm text-secondary">
              {opponentAbbr || "?"}
            </div>
          )}
          <p className="font-lato text-xs font-bold text-secondary uppercase tracking-wider">
            {opponentAbbr}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 md:px-6 pb-5 md:pb-6 gap-3 mt-auto">
        <div className="min-w-0 flex-1">
          {event.venue && (
            <p className="font-lato text-xs text-text-light truncate">{event.venue}</p>
          )}
          {event.meta.broadcast && (
            <p className="font-lato text-[0.625rem] text-text-light/70 uppercase tracking-wider truncate">
              {event.meta.broadcast}
            </p>
          )}
        </div>
        <span className="font-lato text-xs font-bold text-secondary group-hover:text-primary transition-colors shrink-0">
          {isLive ? "Join room →" : "Reserve a room →"}
        </span>
      </div>
    </button>
  );
}
