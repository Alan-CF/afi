import { Link, useNavigate } from "react-router-dom";
import { useFanaticGame } from "../../hooks/useFanatic";

interface Props {
  imageUrl?: string | null;
}

export default function HomeFanaticFeature({ imageUrl = null }: Props) {
  const navigate = useNavigate();
  const { status } = useFanaticGame();
  const isActive = status === "active";

  if (isActive) {
    return (
      <section className="mt-8 md:mt-10 lg:mt-12">
        <div className="flex items-baseline justify-between mb-4 md:mb-5">
          <Link
            to="/fanatic"
            className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            Daily Challenge
          </Link>
          <Link
            to="/fanatic"
            className="font-lato text-sm font-bold text-text-light hover:text-secondary transition-colors shrink-0"
          >
            See all
          </Link>
        </div>

        <article className="relative overflow-hidden rounded-3xl bg-secondary flex items-end min-h-[260px] md:min-h-[300px] lg:min-h-[340px] fade-in-up stagger-1">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <>
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
                style={{ fontSize: "clamp(8rem, 22vw, 18rem)" }}
                aria-hidden
              >
                W
              </span>
            </>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col gap-3 max-w-lg">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Daily Challenge
            </p>
            <h3 className="font-anton text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
              Who is today's Warrior?
            </h3>
            <p className="font-lato text-sm md:text-base text-white/65">
              Guess the player from the clues. New challenge every game day.
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate("/fanatic")}
                className="rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Play now
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <Link
          to="/fanatic"
          className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          Daily Challenge
        </Link>
        <Link
          to="/fanatic"
          className="font-lato text-sm font-bold text-text-light hover:text-secondary transition-colors shrink-0"
        >
          See all
        </Link>
      </div>

      <article className="relative overflow-hidden rounded-3xl bg-white border border-container-border border-l-4 border-l-primary flex items-end min-h-[220px] md:min-h-[260px] lg:min-h-[280px] fade-in-up stagger-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-15"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
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
        )}

        <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col gap-3 max-w-lg">
          <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Daily Challenge
          </p>
          <h3 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
            Next challenge unlocks before tip-off
          </h3>
          <p className="font-lato text-sm md:text-base text-text-light">
            We drop a new player every game day.
          </p>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => navigate("/fanatic")}
              className="rounded-2xl border border-secondary/30 px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-secondary hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              View Fanatic
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
