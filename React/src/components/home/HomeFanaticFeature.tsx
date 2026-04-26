import { useNavigate } from "react-router-dom";
import { useFanaticGame } from "../../hooks/useFanatic";
import Button from "../ui/Button";

export default function HomeFanaticFeature() {
  const navigate = useNavigate();
  const { status } = useFanaticGame();
  const isActive = status === "active";

  return (
    <section className="mt-16 md:mt-20">
      <article className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary flex items-end">
        {/* Court line SVG — pure CSS, no hex */}
        <svg
          viewBox="0 0 800 400"
          className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.04]"
          aria-hidden
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="20" y="20" width="760" height="360" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="280" y="20" width="240" height="140" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="400" cy="160" r="80" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="8 5" />
          <circle cx="400" cy="50" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="340" y1="20" x2="460" y2="20" stroke="currentColor" strokeWidth="3" />
          <circle cx="400" cy="380" r="160" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>

        {/* Warriors W — large decorative monogram */}
        <span
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[20%] font-anton text-primary opacity-[0.07] select-none leading-none"
          style={{ fontSize: "clamp(10rem, 30vw, 24rem)" }}
          aria-hidden
        >
          W
        </span>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
          <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Daily Challenge
          </p>
          <h2 className="font-anton text-3xl md:text-4xl text-white leading-tight">
            {isActive ? "Who is today's Warrior?" : "Fanatic is resting"}
          </h2>
          <p className="font-lato text-sm text-white/60">
            {isActive
              ? "Guess the player from the clues. New challenge every game day."
              : "A new challenge drops before every game day."}
          </p>
          <div>
            <Button
              variant="primary"
              onClick={() => navigate("/fanatic")}
              disabled={!isActive}
            >
              {isActive ? "Play now →" : "Check back soon"}
            </Button>
          </div>
        </div>
      </article>
    </section>
  );
}
