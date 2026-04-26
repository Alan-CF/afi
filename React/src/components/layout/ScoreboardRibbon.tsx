import { useScoreboard } from "../../hooks/useScoreboard";
import LiveBadge from "../common/LiveBadge";

function formatTipoff(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return `${totalMin}m`;
}

function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function ScoreboardRibbon() {
  const state = useScoreboard();

  if (state.kind === "hidden") return null;

  const { game } = state;

  return (
    <div className="sticky top-16 z-30 h-12 bg-secondary border-b border-white/10 flex items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-2 shrink-0">
        <img src={game.warriorsLogo} alt="GSW" className="h-6 w-6 object-contain" />
        <span className="font-lato text-[10px] text-white/40 uppercase tracking-wider">
          {game.isHome ? "vs" : "@"}
        </span>
        <img
          src={game.opponentLogo}
          alt={game.opponentName}
          className="h-6 w-6 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      <span className="h-4 w-px bg-white/20 shrink-0" />

      {state.kind === "pre" && (
        <>
          <span className="font-lato text-xs text-white/50 hidden sm:block">
            {formatLocalTime(game.startAt)}
          </span>
          <span className="font-lato text-xs font-bold text-primary">
            Tip-off in {formatTipoff(state.tipoffMs)}
          </span>
        </>
      )}

      {state.kind === "live" && (
        <>
          <LiveBadge />
          <span className="font-lato text-xs text-white/50">
            {game.statusDetail ?? `Q${game.period ?? ""} ${game.clock ?? ""}`.trim()}
          </span>
          <span className="font-anton text-base text-white tracking-wide tabular-nums">
            {game.warriorsScore ?? 0}
            <span className="text-white/30 mx-1">–</span>
            {game.opponentScore ?? 0}
          </span>
        </>
      )}

      {state.kind === "final" && (
        <>
          <span className="font-lato text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            Final
          </span>
          <span className={`font-anton text-base tracking-wide tabular-nums ${state.won ? "text-green-400" : "text-red-400"}`}>
            {game.warriorsScore ?? 0}
            <span className="text-white/30 mx-1">–</span>
            {game.opponentScore ?? 0}
          </span>
          <span className={`font-lato text-xs font-black ${state.won ? "text-green-400" : "text-red-400"}`}>
            {state.won ? "W" : "L"}
          </span>
        </>
      )}

      <span className="font-lato text-xs text-white/40 hidden md:block">
        {game.opponentName}
      </span>
    </div>
  );
}
