import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useFanaticGame } from "../../hooks/useFanatic";

export default function FanaticTodayCard() {
  const navigate = useNavigate();
  const { status } = useFanaticGame();
  const hasActiveGame = status === "active";

  return (
    <section
      aria-label="Fanatic"
      className="relative overflow-hidden rounded-3xl aspect-[21/9] flex items-end bg-secondary"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 70% 50%, #1a3a6e 0%, #0d1f3c 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
        <h2 className="font-anton text-5xl md:text-6xl text-white lowercase leading-none">
          {hasActiveGame ? "daily\nfanatic" : "fanatic\nis resting"}
        </h2>
        <Button
          variant="primary"
          onClick={() => navigate("/fanatic")}
          disabled={!hasActiveGame}
        >
          {hasActiveGame ? "Play today's riddle →" : "Check back soon"}
        </Button>
      </div>
    </section>
  );
}
