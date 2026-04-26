import { useNavigate } from "react-router-dom";
import { useStatsPreview } from "../../hooks/useStatsPreview";

type Accent = "neutral" | "success" | "destructive";

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

export default function HomeStatsPreview() {
  const navigate = useNavigate();
  const { record, lastGame, topScorer, loading } = useStatsPreview();

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
            value={record ? `${record.wins}–${record.losses}` : "—"}
            loading={loading}
            stagger={1}
          />
          <StatTile
            label="Last Game"
            value={
              lastGame
                ? `${lastGame.isHome ? "vs" : "@"} ${lastGame.opponentAbbr} · ${lastGame.won ? "W" : "L"} ${lastGame.warriorsScore}–${lastGame.opponentScore}`
                : "—"
            }
            loading={loading}
            stagger={2}
            valueAccent={lastGame ? (lastGame.won ? "success" : "destructive") : "neutral"}
          />
          <StatTile
            label="Top Scorer"
            value={topScorer ? `${topScorer.name} · ${topScorer.ppg} PPG` : "—"}
            loading={loading}
            stagger={3}
          />
        </div>
      </div>
    </section>
  );
}
