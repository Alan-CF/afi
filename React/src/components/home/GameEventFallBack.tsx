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

interface GameEventFallbackProps {
  opponent: string;
  isHome: boolean;
  isLive?: boolean;
  size?: "rail" | "hero";
}

export default function GameEventFallback({
  opponent,
  isHome,
  isLive = false,
  size = "rail",
}: GameEventFallbackProps) {
  const opponentLogo = NBA_LOGOS[opponent] ?? null;
  const logoSize = size === "hero" ? "h-28 w-28 md:h-40 md:w-40" : "h-16 w-16 md:h-20 md:w-20";

  return (
    <div className="absolute inset-0 bg-secondary overflow-hidden">
      <svg
        viewBox="0 0 400 250"
        className="absolute inset-0 h-full w-full text-white opacity-[0.04]"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="20" y="20" width="360" height="210" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M 80 20 Q 80 130, 200 130 Q 320 130, 320 20" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="140" y="20" width="120" height="80" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="200" cy="100" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <circle cx="200" cy="32" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="170" y1="20" x2="230" y2="20" stroke="currentColor" strokeWidth="3" />
      </svg>

      {isLive && (
        <div className="absolute inset-0 bg-gradient-to-t from-live/25 via-transparent to-transparent" />
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-8">
        <img
          src={WARRIORS_LOGO}
          alt="Golden State Warriors"
          className={`${logoSize} object-contain opacity-75`}
        />
        <span className="font-anton text-lg md:text-2xl text-white/25 select-none">
          {isHome ? "vs" : "@"}
        </span>
        {opponentLogo ? (
          <img
            src={opponentLogo}
            alt={opponent}
            className={`${logoSize} object-contain opacity-75`}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className={`${logoSize} rounded-full bg-white/10 flex items-center justify-center`}>
            <span className="font-anton text-xs md:text-sm text-white/40">
              {opponent.split(" ").pop()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
