import { useNavigate } from "react-router-dom";
import { ChartBarIcon } from "@heroicons/react/24/solid";

export default function HomeStatsFeature() {
  const navigate = useNavigate();

  return (
    <section className="mt-16 md:mt-20">
      <button
        type="button"
        onClick={() => navigate("/stats")}
        className="group relative block w-full overflow-hidden rounded-3xl bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[16/9] md:aspect-[3/1]">
          {/* Court line decoration — no hex */}
          <svg
            viewBox="0 0 800 300"
            className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]"
            aria-hidden
            preserveAspectRatio="xMaxYMid slice"
          >
            <rect x="20" y="20" width="760" height="260" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 400 20 Q 400 160, 780 160" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="530" y="20" width="230" height="140" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="640" cy="160" r="80" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="8 5" />
          </svg>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

          <ChartBarIcon className="absolute right-5 top-5 md:right-10 md:top-8 h-20 w-20 md:h-36 md:w-36 text-primary opacity-[0.08] group-hover:opacity-[0.13] transition-opacity" />

          <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 md:p-12 max-w-lg">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Season Stats
            </p>
            <h2 className="font-anton text-2xl md:text-4xl text-white leading-tight">
              Analyze the 2025–26 Warriors season
            </h2>
            <p className="font-lato text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Explore stats →
            </p>
          </div>
        </div>
      </button>
    </section>
  );
}
