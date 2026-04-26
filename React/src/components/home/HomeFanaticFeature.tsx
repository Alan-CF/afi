import { useNavigate } from "react-router-dom";
import { useFanaticGame } from "../../hooks/useFanatic";

export default function HomeFanaticFeature() {
  const navigate = useNavigate();
  const { status } = useFanaticGame();
  const isActive = status === "active";

  if (isActive) {
    return (
      <section className="mt-16 md:mt-20">
        <article className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary flex items-end fade-in-up stagger-1">
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
            <circle cx="400" cy="380" r="160" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>

          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[20%] font-anton text-primary opacity-[0.07] select-none leading-none"
            style={{ fontSize: "clamp(10rem, 30vw, 24rem)" }}
            aria-hidden
          >
            W
          </span>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

          <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Daily Challenge
            </p>
            <h2 className="font-anton text-4xl md:text-5xl text-white leading-tight">
              Who is today's Warrior?
            </h2>
            <p className="font-lato text-base text-white/65">
              Guess the player from the clues. New challenge every game day.
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate("/fanatic")}
                className="rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Play now →
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mt-16 md:mt-20">
      <article className="relative overflow-hidden rounded-3xl bg-white border border-container-border border-l-4 border-l-primary aspect-[4/5] md:aspect-[16/9] flex items-end fade-in-up stagger-1">
        <svg
          viewBox="0 0 800 400"
          className="pointer-events-none absolute inset-0 h-full w-full text-secondary opacity-[0.04]"
          aria-hidden
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="20" y="20" width="760" height="360" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="400" cy="380" r="160" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>

        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-3 max-w-lg">
          <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Daily Challenge
          </p>
          <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
            Next challenge unlocks before tip-off
          </h2>
          <p className="font-lato text-base text-text-light">
            We drop a new player every game day.
          </p>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => navigate("/fanatic")}
              className="rounded-2xl border border-secondary/30 px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-secondary hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              View Fanatic →
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
