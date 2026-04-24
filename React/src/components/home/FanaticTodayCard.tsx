import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useFanaticGame, useFanaticRiddles, useFanaticTries } from "../../hooks/useFanatic";
import { useProfile } from "../../hooks/useProfile";

export default function FanaticTodayCard() {
  const navigate = useNavigate();
  const { user } = useProfile();
  const hasAuth = user !== null;

  const { status } = useFanaticGame();
  const hasActiveGame = status === "active";

  const { riddles, category } = useFanaticRiddles({ enabled: hasActiveGame });
  const { triesInfo } = useFanaticTries({ enabled: hasActiveGame && hasAuth });

  const latestRiddle = riddles.length > 0 ? riddles[riddles.length - 1]?.riddle : null;
  const triesLeft = triesInfo?.remaining_tries_today ?? null;

  return (
    <section
      aria-label="Fanatic Today"
      className="relative overflow-hidden rounded-3xl bg-secondary text-white min-h-[320px] flex flex-col justify-end p-7"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 10%, #FFC72C 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-lato text-xs font-black uppercase tracking-[0.2em] text-primary">
            Daily Challenge
          </span>
          {category && (
            <span className="rounded-full bg-primary/20 border border-primary/40 px-3 py-1 font-lato text-[0.6rem] font-black uppercase tracking-[0.14em] text-primary">
              {category}
            </span>
          )}
        </div>

        <h2 className="font-anton text-4xl uppercase leading-tight">
          Fanatic Today
        </h2>

        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          {!hasActiveGame ? (
            <p className="font-lato text-sm italic text-white/60">
              No active game right now — check back soon.
            </p>
          ) : latestRiddle ? (
            <p className="font-lato text-sm italic text-white/90 line-clamp-3">
              "{latestRiddle}"
            </p>
          ) : (
            <p className="font-lato text-sm italic text-white/60">Loading today's clue…</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-lato text-xs text-white/50">
            {hasAuth && triesLeft !== null
              ? `${triesLeft} tries left today`
              : "Log in to play"}
          </span>
          <Button variant="primary" onClick={() => navigate("/fanatic")}>
            Play Now
          </Button>
        </div>
      </div>
    </section>
  );
}
