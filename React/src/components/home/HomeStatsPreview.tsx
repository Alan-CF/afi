import { useNavigate } from "react-router-dom";
import { useStatsPreview } from "../../hooks/useStatsPreview";

type Accent = "neutral" | "success" | "destructive" | "primary";

function StatTile({
  label,
  value,
  loading,
  stagger,
  valueAccent = "neutral",
}: {
  label: string;
  value: string;
  loading: boolean;
  stagger: number;
  valueAccent?: Accent;
}) {
  const accentClass =
    valueAccent === "success" ? "text-success"
    : valueAccent === "destructive" ? "text-destructive"
    : valueAccent === "primary" ? "text-primary"
    : "text-secondary";

  return (
    <div className={`fade-in-up stagger-${stagger}`}>
      <p className="font-lato text-[0.625rem] font-bold uppercase tracking-[0.18em] text-text-light mb-2">
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-32 rounded skeleton-shimmer" />
      ) : (
        <p className={`font-anton text-2xl md:text-3xl leading-tight tabular-nums ${accentClass}`}>
          {value}
        </p>
      )}
    </div>
  );
}

function formatNextGame(start: string): string {
  return new Date(start).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HomeStatsPreview() {
  const navigate = useNavigate();
  const { record, lastGame, nextGame, topScorer, loading } = useStatsPreview();

  const recordValue = record ? `${record.wins}–${record.losses}` : "62–20";

  let secondLabel = "Last Game";
  let secondValue: string;
  let secondAccent: Accent;

  if (lastGame) {
    secondValue = `${lastGame.isHome ? "vs" : "@"} ${lastGame.opponentAbbr} · ${lastGame.won ? "W" : "L"} ${lastGame.warriorsScore}–${lastGame.opponentScore}`;
    secondAccent = lastGame.won ? "success" : "destructive";
  } else if (nextGame) {
    secondLabel = "Next Game";
    secondValue = `${nextGame.isHome ? "vs" : "@"} ${nextGame.opponentAbbr} · ${formatNextGame(nextGame.startAt)}`;
    secondAccent = "primary";
  } else {
    secondLabel = "Next Game";
    secondValue = "TBD";
    secondAccent = "neutral";
  }

  const topScorerValue = topScorer ? `${topScorer.name} · ${topScorer.ppg} PPG` : "Stephen Curry · 26.4 PPG";

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <div>
          <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
            Season Stats
          </h2>
          <p className="font-lato text-sm text-text-light mt-1">
            2025–26 Warriors snapshot
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/stats")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors shrink-0"
        >
          Explore stats →
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-container-border p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <StatTile
            label="Record"
            value={recordValue}
            loading={loading}
            stagger={1}
          />
          <StatTile
            label={secondLabel}
            value={secondValue}
            loading={loading}
            stagger={2}
            valueAccent={secondAccent}
          />
          <StatTile
            label="Top Scorer"
            value={topScorerValue}
            loading={loading}
            stagger={3}
          />
        </div>
      </div>
    </section>
  );
}
