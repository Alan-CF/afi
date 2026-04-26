import { useNavigate } from "react-router-dom";
import type { UnifiedEvent } from "../../hooks/events";
import GameEventFallback from "./GameEventFallback";
import LiveBadge from "../common/LiveBadge";
import Button from "../ui/Button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function HomeGameCard({ event }: { event: UnifiedEvent }) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;
  const hasScore = event.meta.warriorsScore != null && event.meta.opponentScore != null;

  return (
    <section className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9]">
      <GameEventFallback
        opponent={event.subtitle ?? ""}
        isHome={event.meta.isHome ?? true}
        isLive={isLive}
        size="hero"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-full md:max-w-[55%]">
        <div className="mb-3 md:mb-4">
          {isLive
            ? <LiveBadge />
            : <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">Next Game</p>}
        </div>

        {isLive && hasScore ? (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              Warriors{" "}
              <span className="text-primary tabular-nums">{event.meta.warriorsScore}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/70 tabular-nums">{event.meta.opponentScore}</span>{" "}
              {(event.subtitle ?? "").split(" ").pop()}
            </h2>
            <p className="mt-2 font-lato text-sm text-white/55">In progress</p>
          </>
        ) : (
          <>
            <h2 className="font-anton text-3xl md:text-5xl text-white leading-tight">
              {event.title}
            </h2>
            <p className="mt-2 font-lato text-sm text-white/55">
              {formatDate(event.startAt)}
            </p>
          </>
        )}

        <div className="mt-5 md:mt-6">
          <Button
            variant="primary"
            onClick={() => navigate(isLive ? "/rooms" : "/events")}
          >
            {isLive ? "Join live room →" : "View event →"}
          </Button>
        </div>
      </div>
    </section>
  );
}
