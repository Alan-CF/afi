import { useMockScoreboard } from "../../hooks/mockScoreboard";
import LiveBadge from "../common/LiveBadge";

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";
const OPPONENT_LOGOS: Record<string, string> = {
  "Memphis Grizzlies": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
};

export default function ScoreboardRibbon() {
  const state = useMockScoreboard();
  const isLive = state.phase === "live";

  return (
    <div className="sticky top-16 z-30 h-12 bg-secondary border-b border-white/10 flex items-center justify-center gap-4 px-4">

      <div className="flex items-center gap-2 shrink-0">
        <img src={WARRIORS_LOGO} alt="GSW" className="h-6 w-6 object-contain" />
        <span className="font-lato text-[10px] text-white/40 uppercase tracking-wider">vs</span>
        <img
          src={OPPONENT_LOGOS[state.opponent] ?? ""}
          alt={state.opponent}
          className="h-6 w-6 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      <span className="h-4 w-px bg-white/20 shrink-0" />

      {state.phase === "pre" && (
        <>
          <span className="font-lato text-xs text-white/50 hidden sm:block">{state.label}</span>
          <span className="font-lato text-xs font-bold text-primary">Tip-off in {state.countdown}</span>
        </>
      )}

      {state.phase === "live" && (
        <>
          <LiveBadge />
          <span className="font-lato text-xs text-white/50">{state.period}</span>
          <span className="font-anton text-base text-white tracking-wide">
            {state.warriorsScore}
            <span className="text-white/30 mx-1">–</span>
            {state.opponentScore}
          </span>
        </>
      )}

      {state.phase === "halftime" && (
        <>
          <span className="font-lato text-[10px] font-black uppercase tracking-[0.18em] text-primary">Halftime</span>
          <span className="font-anton text-base text-white tracking-wide">
            {state.warriorsScore}
            <span className="text-white/30 mx-1">–</span>
            {state.opponentScore}
          </span>
        </>
      )}

      {state.phase === "final" && (
        <>
          <span className="font-lato text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Final</span>
          <span className={`font-anton text-base tracking-wide ${state.won ? "text-green-400" : "text-red-400"}`}>
            {state.warriorsScore}
            <span className="text-white/30 mx-1">–</span>
            {state.opponentScore}
          </span>
          <span className={`font-lato text-xs font-black ${state.won ? "text-green-400" : "text-red-400"}`}>
            {state.won ? "W" : "L"}
          </span>
        </>
      )}

      {!isLive && (
        <span className="font-lato text-xs text-white/40 hidden md:block">{state.opponent}</span>
      )}
    </div>
  );
}
