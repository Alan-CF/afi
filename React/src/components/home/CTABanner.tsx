import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-secondary px-8 py-16 text-white md:px-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 50%, #FFC72C 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col gap-3 max-w-xl">
          <span className="font-lato text-xs font-black uppercase tracking-[0.2em] text-primary">
            Join the Dub Nation
          </span>
          <h2 className="font-anton text-4xl leading-tight md:text-5xl">
            Be part of the ultimate Warriors fan experience.
          </h2>
          <p className="font-lato text-base text-white/70">
            Predict games, join watch-parties, compete on the leaderboard,
            and earn rewards — all free.
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <Button variant="primary" onClick={() => navigate("/login")}>
            Sign up free
          </Button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-lato text-sm text-white/60 hover:text-white transition-colors"
          >
            Already a member? Log in
          </button>
        </div>
      </div>
    </section>
  );
}
