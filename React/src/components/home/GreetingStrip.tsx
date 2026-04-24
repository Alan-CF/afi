import { useHome } from "../../hooks/useHome";

export default function GreetingStrip() {
  const { greeting, loading } = useHome();

  if (loading || !greeting) return null;

  const hour = new Date().getHours();
  const timeLabel =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section aria-label="Greeting" className="pt-6 md:pt-8">
      <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light">
        {timeLabel}
      </p>
      <p className="mt-1 font-lato text-lg md:text-xl font-bold text-secondary">
        @{greeting.username}
      </p>
    </section>
  );
}
