import { useEffect, useMemo, useRef, useState } from "react";
import NavBar from "../components/layout/NavBar";
import { supabase } from "../lib/supabaseClient";

type LegacyViewMode = "moments" | "players";

type LegacyYear = {
  id: number;
  year: number;
  title: string;
  subtitle: string | null;
  description: string;
  image_url: string;
  display_order: number;
};

type LegacyMoment = {
  id: number;
  year_id: number;
  year: number;
  title: string;
  subtitle: string | null;
  description: string;
  image_url: string;
  cta_label: string | null;
  display_order: number;
};

type LegacyPlayer = {
  id: number;
  name: string;
  role: string;
  jersey_number: string | null;
  bio: string;
  image_url: string;
  highlight_text: string | null;
  display_order: number;
};

function Legacy() {
  const [viewMode, setViewMode] = useState<LegacyViewMode>("moments");
  const [years, setYears] = useState<LegacyYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [moments, setMoments] = useState<LegacyMoment[]>([]);
  const [players, setPlayers] = useState<LegacyPlayer[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedYear = useMemo(() => {
    return years.find((year) => year.id === selectedYearId) ?? null;
  }, [years, selectedYearId]);

  const activeContent = viewMode === "moments" ? moments : players;
  const isContentEmpty = !loadingContent && activeContent.length === 0;
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleSelectYear = (yearId: number) => {
    setSelectedYearId(yearId);

    setTimeout(() => {
        yearRefs.current[yearId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        });
    }, 80);
    };

  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      setError(null);

      const { data, error } = await supabase
        .from("legacy_years")
        .select("*")
        .order("year", { ascending: true });

      if (error) {
        setError("Oops! Something went wrong loading Warriors Legacy.");
        setLoadingYears(false);
        return;
      }

      const loadedYears = data ?? [];
      setYears(loadedYears);

      if (loadedYears.length > 0) {
        setSelectedYearId(loadedYears[0].id);
      }

      setLoadingYears(false);
    };

    loadYears();
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;

    const loadContent = async () => {
      setLoadingContent(true);
      setError(null);

      const [momentsResponse, playersResponse] = await Promise.all([
        supabase
          .from("legacy_moments")
          .select("*")
          .eq("year_id", selectedYearId)
          .order("display_order", { ascending: true }),
        supabase
          .from("legacy_year_players")
          .select(`
            highlight_text,
            display_order,
            legacy_players (
              id,
              name,
              role,
              jersey_number,
              bio,
              image_url
            )
          `)
          .eq("year_id", selectedYearId)
          .order("display_order", { ascending: true }),
      ]);

      if (momentsResponse.error || playersResponse.error) {
        setError("Oops! Something went wrong loading this era.");
        setLoadingContent(false);
        return;
      }

      setMoments(momentsResponse.data ?? []);

      const mappedPlayers =
        playersResponse.data?.map((item: any) => ({
          id: item.legacy_players.id,
          name: item.legacy_players.name,
          role: item.legacy_players.role,
          jersey_number: item.legacy_players.jersey_number,
          bio: item.legacy_players.bio,
          image_url: item.legacy_players.image_url,
          highlight_text: item.highlight_text,
          display_order: item.display_order,
        })) ?? [];

      setPlayers(mappedPlayers);
      setLoadingContent(false);
    };

    loadContent();
  }, [selectedYearId]);

  if (loadingYears) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-text-light-soft)]">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-lato text-2xl animate-pulse text-secondary">
            Loading Legacy...
          </p>
        </div>
      </div>
    );
  }

  if (error && !selectedYear) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-text-light-soft)]">
        <NavBar />
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="font-lato text-xl text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-10">
        <section className="rounded-2xl bg-white px-4 py-6 text-center mb-5">
          <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
            Warriors History
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mt-2">
            Warriors Legacy
          </h1>

          <p className="text-secondary/80 font-semibold mt-2 max-w-2xl mx-auto">
            Explore the eras, moments, and players that shaped Golden State basketball.
          </p>
        </section>

        <section className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setViewMode("moments")}
              className={`rounded-lg py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                viewMode === "moments"
                  ? "bg-[var(--color-primary)] text-secondary"
                  : "bg-secondary text-white hover:bg-secondary/90"
              }`}
            >
              Iconic Moments
            </button>

            <button
              type="button"
              onClick={() => setViewMode("players")}
              className={`rounded-lg py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                viewMode === "players"
                  ? "bg-[var(--color-primary)] text-secondary"
                  : "bg-secondary text-white hover:bg-secondary/90"
              }`}
            >
              Historic Players
            </button>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-5 text-red-600 text-sm font-semibold">
            {error}
          </section>
        )}
        <section className="space-y-0">
            {years.map((year, index) => {
                const selectedIndex = years.findIndex((item) => item.id === selectedYearId);
                const distance = Math.abs(index - selectedIndex);
                const isSelected = year.id === selectedYearId;
                const isNear = distance === 1;

                return (
                <div
                    key={year.id}
                    ref={(el) => {
                        yearRefs.current[year.id] = el;
                    }}
                    className="scroll-mt-24 grid grid-cols-[72px_1fr] md:grid-cols-[100px_1fr] gap-4 md:gap-6"
                    >
                    <aside className="relative flex justify-center">
                    <div className="absolute top-0 bottom-0 left-1/2 w-[3px] -translate-x-1/2 bg-secondary/20" />

                    <button
                        type="button"
                        onClick={() => handleSelectYear(year.id)}
                        className="relative z-10 flex h-13 w-13 items-start justify-center pt-1"
                    >
                        <span
                        className={`flex items-center justify-center rounded-full border font-bold transition-all duration-200 ${
                            isSelected
                            ? "h-13 w-13 bg-secondary text-white border-secondary text-base shadow-md scale-105"
                            : isNear
                            ? "h-11 w-11 bg-white text-secondary border-secondary/60 text-sm hover:bg-secondary hover:text-white"
                            : "h-11 w-11 bg-white text-secondary border-secondary/40 text-sm hover:bg-secondary hover:text-white"
                        }`}
                        >
                        {year.year}
                        </span>
                    </button>
                    </aside>

                    <div className="min-w-0 pb-5">
                    <button
                        type="button"
                        onClick={() => setSelectedYearId(year.id)}
                        className={`w-full text-left rounded-2xl overflow-hidden bg-[var(--color-text-light-soft)] shadow-sm transition-all duration-300 ${
                        isSelected
                            ? "ring-2 ring-secondary/20 scale-[1.01]"
                            : "hover:shadow-md hover:scale-[1.005]"
                        }`}
                    >
                        <div className="relative h-[155px] md:h-[190px]">
                        <img
                            src={year.image_url}
                            alt={year.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-none">
                            {year.title}
                            </h2>

                            {year.subtitle && (
                            <p className="text-white/90 text-sm md:text-base font-semibold mt-2">
                                {year.subtitle}
                            </p>
                            )}
                        </div>
                        </div>

                        <div className="p-4">
                        <p className="text-black text-sm md:text-base leading-7">
                            {year.description}
                        </p>
                        </div>
                    </button>

                    {isSelected && (
                        <div className="mt-4 animate-[fadeIn_0.25s_ease-in-out]">
                        {loadingContent ? (
                            <section className="flex items-center justify-center py-10">
                            <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
                            </section>
                        ) : (
                            <section>
                            <div className="mb-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                                {selectedYear?.year}
                                </p>

                                <h3 className="text-2xl md:text-3xl font-extrabold text-secondary leading-none">
                                {viewMode === "moments" ? "Iconic Moments" : "Historic Players"}
                                </h3>
                            </div>

                            {isContentEmpty ? (
                                <div className="rounded-2xl bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] p-8 text-center">
                                <p className="text-2xl font-extrabold text-secondary">No content yet</p>
                                <p className="text-black mt-2">
                                    There is no legacy content registered for this era.
                                </p>
                                </div>
                            ) : viewMode === "moments" ? (
                                <div className="space-y-4">
                                {moments.map((moment) => (
                                    <article
                                    key={moment.id}
                                    className="rounded-2xl overflow-hidden bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] h-[340px] md:h-[230px] md:grid md:grid-cols-[0.9fr_1.1fr]"
                                    >
                                    <div className="relative h-[155px] md:h-full">
                                        <img
                                        src={moment.image_url}
                                        alt={moment.title}
                                        className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="p-4 md:p-5 flex flex-col justify-center overflow-hidden">
                                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">
                                        {moment.subtitle ?? `${moment.year}`}
                                        </p>

                                        <h4 className="text-xl md:text-2xl font-extrabold text-secondary leading-tight line-clamp-2">
                                        {moment.title}
                                        </h4>

                                        <p className="text-black text-sm md:text-base leading-6 mt-3 line-clamp-4">
                                        {moment.description}
                                        </p>
                                    </div>
                                    </article>
                                ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                {players.map((player) => (
                                    <article
                                    key={player.id}
                                    className="rounded-2xl overflow-hidden bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] h-[340px] md:h-[230px] md:grid md:grid-cols-[0.85fr_1.15fr]"
                                    >
                                    <div className="relative h-[155px] md:h-full">
                                        <img
                                        src={player.image_url}
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                        />

                                        {player.jersey_number && (
                                        <div className="absolute top-3 right-3 h-11 w-11 rounded-xl bg-secondary text-white flex items-center justify-center shadow-md">
                                            <span className="text-xl font-extrabold">
                                            {player.jersey_number}
                                            </span>
                                        </div>
                                        )}
                                    </div>

                                    <div className="p-4 md:p-5 flex flex-col justify-center overflow-hidden">
                                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2 line-clamp-1">
                                        {player.role ?? "Warriors Legend"}
                                        </p>

                                        <h4 className="text-xl md:text-2xl font-extrabold text-secondary leading-tight line-clamp-2">
                                        {player.name}
                                        </h4>

                                        <p className="text-black text-sm md:text-base leading-6 mt-3 line-clamp-4">
                                        {player.highlight_text ?? player.bio}
                                        </p>
                                    </div>
                                    </article>
                                ))}
                                </div>
                            )}
                            </section>
                        )}
                        </div>
                    )}
                    </div>
                </div>
                );
            })}
        </section>
      </main>
    </div>
  );
}

export default Legacy;