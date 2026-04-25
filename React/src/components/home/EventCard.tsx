import { useNavigate } from "react-router-dom";
import { setFanEventAttendance } from "../../hooks/fanEvents";
import type { UnifiedEvent } from "../../hooks/events";

const WARRIORS_LOGO = "https://a.espncdn.com/i/teamlogos/nba/500/gs.png";

const NBA_LOGOS: Record<string, string> = {
  "Sacramento Kings":       "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
  "Los Angeles Lakers":     "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Los Angeles Clippers":   "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
  "Phoenix Suns":           "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
  "Denver Nuggets":         "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
  "Oklahoma City Thunder":  "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
  "Minnesota Timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
  "Dallas Mavericks":       "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
  "Houston Rockets":        "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
  "Memphis Grizzlies":      "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
  "Portland Trail Blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
  "Utah Jazz":              "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
  "San Antonio Spurs":      "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
  "New Orleans Pelicans":   "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
  "Boston Celtics":         "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
  "Miami Heat":             "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
  "Milwaukee Bucks":        "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
  "Cleveland Cavaliers":    "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
  "New York Knicks":        "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
  "Philadelphia 76ers":     "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
  "Atlanta Hawks":          "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
  "Chicago Bulls":          "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
  "Toronto Raptors":        "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
  "Brooklyn Nets":          "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
  "Indiana Pacers":         "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
  "Charlotte Hornets":      "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
  "Washington Wizards":     "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
  "Detroit Pistons":        "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
  "Orlando Magic":          "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export default function EventCard({ event }: { event: UnifiedEvent }) {
  const navigate = useNavigate();
  const isLive = event.meta.isLive === true;
  const opponentLogo = event.subtitle ? NBA_LOGOS[event.subtitle] ?? null : null;

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
      className="group relative shrink-0 w-[280px] h-[320px] overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={event.title}
    >
      {event.type === "game" ? (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center gap-4">
          <img
            src={WARRIORS_LOGO}
            alt="Warriors"
            className="h-20 w-20 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <span className="font-anton text-3xl text-white/60">
            {event.meta.isHome ? "vs" : "@"}
          </span>
          {opponentLogo ? (
            <img
              src={opponentLogo}
              alt={event.subtitle ?? ""}
              className="h-20 w-20 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-anton text-sm text-white">
                {(event.subtitle ?? "").split(" ").pop()}
              </span>
            </div>
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

      {event.type === "game" && event.meta.warriorsScore != null && event.meta.opponentScore != null && (
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1">
          <span className="font-barlow-condensed text-sm font-bold text-white">
            {event.meta.warriorsScore} – {event.meta.opponentScore}
          </span>
        </div>
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
