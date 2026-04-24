import { useHome } from "../../hooks/useHome";

export default function GreetingStrip() {
  const { greeting, loading } = useHome();

  if (loading || !greeting) return null;

  const hour = new Date().getHours();
  const timeLabel =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section aria-label="Greeting" className="pt-6 md:pt-8 pb-1">
      <p className="font-lato text-sm text-text-light">
        {timeLabel},
      </p>
      <h1 className="font-anton text-3xl md:text-4xl text-secondary leading-tight mt-0.5">
        @{greeting.username}
      </h1>
    </section>
  );
}
