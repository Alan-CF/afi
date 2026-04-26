import { useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";

export default function HomeAuthCTA() {
  const navigate = useNavigate();
  const { user, hasLoadedOnce } = useProfile();

  if (!hasLoadedOnce) {
    return (
      <section className="mt-16 md:mt-20">
        <div className="rounded-3xl aspect-[4/5] md:aspect-[21/9] skeleton-shimmer" />
      </section>
    );
  }

  const isLoggedIn = user !== null;

  if (isLoggedIn) {
    return (
      <section className="mt-16 md:mt-20" aria-label="Continue your fan journey">
        <article className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary flex items-end fade-in-up stagger-1">
          <svg
            viewBox="0 0 800 400"
            className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]"
            aria-hidden
            preserveAspectRatio="xMidYMid slice"
          >
            <rect x="20" y="20" width="760" height="360" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="400" cy="380" r="160" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[15%] font-anton text-primary opacity-[0.08] select-none leading-none"
            style={{ fontSize: "clamp(10rem, 30vw, 22rem)" }}
            aria-hidden
          >
            W
          </span>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

          <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Dub Nation
            </p>
            <h2 className="font-anton text-4xl md:text-5xl text-white leading-tight">
              Keep building your fan profile
            </h2>
            <p className="font-lato text-base text-white/65">
              Play Fanatic, join a room, or climb the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate("/myprofile")}
                className="rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Go to profile →
              </button>
              <button
                type="button"
                onClick={() => navigate("/fanatic")}
                className="rounded-2xl border border-white/30 px-5 py-3 font-lato text-sm font-bold text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Open Fanatic
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mt-16 md:mt-20" aria-label="Join AFI">
      <article className="relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-primary flex items-end fade-in-up stagger-1">
        <svg
          viewBox="0 0 800 400"
          className="pointer-events-none absolute inset-0 h-full w-full text-secondary opacity-[0.07]"
          aria-hidden
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="20" y="20" width="760" height="360" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="400" cy="380" r="160" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[15%] font-anton text-secondary opacity-[0.10] select-none leading-none"
          style={{ fontSize: "clamp(10rem, 30vw, 22rem)" }}
          aria-hidden
        >
          W
        </span>

        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
          <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Dub Nation
          </p>
          <h2 className="font-anton text-4xl md:text-5xl text-secondary leading-tight">
            Join AFI before tip-off
          </h2>
          <p className="font-lato text-base text-secondary/75">
            Create your profile, earn points, join rooms, and follow every Warriors moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-2xl bg-secondary px-5 py-3 font-lato text-sm font-bold text-white hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              Create account →
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-2xl border border-secondary/30 px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-secondary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              Log in
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
