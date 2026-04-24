import { useHome } from "../../hooks/useHome";

export default function GreetingStrip() {
  const { greeting, loading } = useHome();

  if (loading || !greeting) return null;

  const hour = new Date().getHours();
  const timeLabel =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="pt-6 md:pt-8">
      <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-text-light">
        {timeLabel}
      </p>
      <p className="mt-1 font-anton text-2xl md:text-3xl text-secondary leading-tight">
        @{greeting.username}
      </p>
    </div>
  );
}
