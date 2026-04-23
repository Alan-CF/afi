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
      className="flex h-full flex-col gap-3 rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm"
    >
      <header className="flex items-center justify-between">
        <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">
          Daily challenge
        </p>
        {category && (
          <span className="rounded-full bg-primary px-3 py-1 font-lato text-[0.6rem] font-black uppercase tracking-[0.14em] text-secondary">
            {category}
          </span>
        )}
      </header>

      <h2 className="font-anton text-3xl text-secondary">Fanatic Today</h2>

      <div className="rounded-2xl bg-text-light-soft p-4">
        {!hasActiveGame ? (
          <p className="font-lato italic text-text-light">
            No active Fanatic game right now — check back soon.
          </p>
        ) : latestRiddle ? (
          <p className="font-lato italic text-text line-clamp-3">"{latestRiddle}"</p>
        ) : (
          <p className="font-lato italic text-text-light">Loading today's clue…</p>
        )}
      </div>

      <div className="font-lato text-xs text-text-light">
        {hasAuth && triesLeft !== null ? (
          <span><strong className="text-secondary">{triesLeft}</strong> tries left today</span>
        ) : (
          <span>Log in to play</span>
        )}
      </div>

      <Button variant="primary" onClick={() => navigate("/fanatic")}>
        Play Fanatic
      </Button>
    </section>
  );
}
