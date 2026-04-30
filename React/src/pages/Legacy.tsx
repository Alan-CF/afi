import { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/layout/NavBar';
import { supabase } from '../lib/supabaseClient';
import XMarkIcon from '@heroicons/react/24/solid/esm/XMarkIcon';
import ChevronRightIcon from '@heroicons/react/24/solid/esm/ChevronRightIcon';
import Footer from '../components/layout/Footer';

type LegacyViewMode = 'moments' | 'players';

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
  const [viewMode, setViewMode] = useState<LegacyViewMode>('moments');
  const [years, setYears] = useState<LegacyYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [moments, setMoments] = useState<LegacyMoment[]>([]);
  const [players, setPlayers] = useState<LegacyPlayer[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const selectedYear = useMemo(() => {
    return years.find((year) => year.id === selectedYearId) ?? null;
  }, [years, selectedYearId]);

  const activeContent = viewMode === 'moments' ? moments : players;
  const isContentEmpty = !loadingContent && activeContent.length === 0;

  const handleSelectYear = (yearId: number) => {
    setSelectedYearId(yearId);
    setTimelineOpen(false);
  };

  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      setError(null);

      const { data, error } = await supabase
        .from('legacy_years')
        .select('*')
        .order('year', { ascending: true });

      if (error) {
        setError('Oops! Something went wrong loading Warriors Legacy.');
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
          .from('legacy_moments')
          .select('*')
          .eq('year_id', selectedYearId)
          .order('display_order', { ascending: true }),
        supabase
          .from('legacy_year_players')
          .select(
            `
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
          `
          )
          .eq('year_id', selectedYearId)
          .order('display_order', { ascending: true }),
      ]);

      if (momentsResponse.error || playersResponse.error) {
        setError('Oops! Something went wrong loading this era.');
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
    <div className="min-h-screen bg-text-light-soft font-[family-name:var(--font-lato)]">
      <NavBar />

      <main className="w-full px-4 pb-10 pt-5 md:px-8 lg:px-10">
        <section className="rounded-2xl bg-white px-4 py-6 text-center mb-5 border border-[var(--color-container-border)]">
          <p className="text-secondary/70 text-sm uppercase tracking-widest font-semibold">
            Warriors History
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mt-2">
            Warriors Legacy
          </h1>

          <p className="text-secondary/80 font-semibold mt-2 max-w-2xl mx-auto">
            Explore the eras, moments, and players that shaped Golden State
            basketball.
          </p>
        </section>

        <section className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setViewMode('moments')}
              className={`rounded-lg py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                viewMode === 'moments'
                  ? 'bg-[var(--color-primary)] text-secondary'
                  : 'bg-secondary text-white hover:bg-secondary/90'
              }`}
            >
              Iconic Moments
            </button>

            <button
              type="button"
              onClick={() => setViewMode('players')}
              className={`rounded-lg py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                viewMode === 'players'
                  ? 'bg-[var(--color-primary)] text-secondary'
                  : 'bg-secondary text-white hover:bg-secondary/90'
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

        {/* MOBILE TIMELINE BUTTON */}
        <section className="lg:hidden mb-5">
          <button
            type="button"
            onClick={() => setTimelineOpen(true)}
            className="w-full rounded-2xl bg-white border border-secondary/25 shadow-sm px-4 py-4 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">
                Selected Era
              </p>
              <p className="text-2xl font-extrabold text-secondary mt-1">
                {selectedYear?.year ?? 'Choose year'}
              </p>
              <p className="text-sm text-black/60 font-semibold line-clamp-1">
                {selectedYear?.title}
              </p>
            </div>

            <span className="rounded-xl bg-secondary text-white px-4 py-2 text-sm font-bold shadow-sm">
              View Timeline
            </span>
          </button>
        </section>

        {/* MOBILE TIMELINE SHEET */}
        {timelineOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close timeline"
              onClick={() => setTimelineOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            <div className="absolute left-0 right-0 bottom-0 rounded-t-[2rem] bg-white shadow-2xl max-h-[82vh] overflow-hidden">
              {/* Handle */}
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />

              {/* Header */}
              <div className="sticky top-0 z-10 bg-white px-5 pt-4 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-400 font-bold">
                      Timeline
                    </p>
                    <h2 className="text-3xl font-extrabold text-secondary leading-none mt-1">
                      Choose an Era
                    </h2>
                    <p className="text-sm text-black/60 font-semibold mt-2">
                      Pick a year to explore its moments and players.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTimelineOpen(false)}
                    aria-label="Close timeline"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-black transition hover:bg-gray-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Timeline list */}
              <div className="px-5 py-5 overflow-y-auto max-h-[62vh]">
                <div className="relative">
                  {/* línea */}
                  <div className="absolute left-6 top-5 bottom-5 w-[2px] rounded-full bg-secondary/20" />

                  <div className="space-y-3">
                    {years.map((year) => {
                      const isSelected = year.id === selectedYearId;

                      return (
                        <button
                          key={year.id}
                          type="button"
                          onClick={() => handleSelectYear(year.id)}
                          className={`
                          group relative z-10 w-full rounded-2xl border p-4 text-left transition-all
                          ${
                            isSelected
                              ? 'bg-secondary text-white border-secondary shadow-md'
                              : 'bg-[var(--color-text-light-soft)] text-black border-gray-200 hover:border-secondary hover:bg-white'
                          }
                        `}
                        >
                          <div className="flex items-center gap-4">
                            {/* círculo año */}
                            <div
                              className={`
                              relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-extrabold
                              ${
                                isSelected
                                  ? 'bg-white text-secondary border-white'
                                  : 'bg-white text-secondary border-secondary/40'
                              }
                            `}
                            >
                              {year.year}

                              {isSelected && (
                                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-white" />
                              )}
                            </div>

                            {/* título */}
                            <div className="min-w-0 flex-1">
                              <h3
                                className={`
                                text-base font-extrabold leading-tight line-clamp-1
                                ${isSelected ? 'text-white' : 'text-secondary'}
                              `}
                              >
                                {year.title}
                              </h3>
                            </div>

                            {/* 🔥 ICONO BIEN HECHO */}
                            <ChevronRightIcon
                              className={`
                              h-6 w-6 transition-all duration-200
                              ${
                                isSelected
                                  ? 'text-primary translate-x-1'
                                  : 'text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5'
                              }
                            `}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP + CONTENT */}
        <section className="lg:grid lg:grid-cols-[190px_1fr] xl:grid-cols-[220px_1fr] lg:gap-7">
          {/* DESKTOP TIMELINE - NO STICKY */}
          <aside className="hidden lg:block">
            <div className="rounded-3xl bg-white border border-[var(--color-container-border)] shadow-sm p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-4">
                Timeline
              </p>

              <div className="relative">
                <div className="absolute top-2 bottom-2 left-6 w-[3px] rounded-full bg-secondary/20" />

                <div className="space-y-3">
                  {years.map((year) => {
                    const isSelected = year.id === selectedYearId;

                    return (
                      <button
                        key={year.id}
                        type="button"
                        onClick={() => handleSelectYear(year.id)}
                        className={`relative z-10 flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all ${
                          isSelected
                            ? 'bg-secondary/10'
                            : 'hover:bg-[var(--color-text-light-soft)]'
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-extrabold transition-all ${
                            isSelected
                              ? 'bg-secondary text-white border-secondary shadow-md'
                              : 'bg-white text-secondary border-secondary/50'
                          }`}
                        >
                          {year.year}
                        </span>

                        <span
                          className={`text-xs font-bold leading-tight line-clamp-2 ${
                            isSelected ? 'text-secondary' : 'text-black/60'
                          }`}
                        >
                          {year.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <div className="min-w-0">
            {selectedYear && (
              <section className="rounded-3xl overflow-hidden bg-white border border-[var(--color-container-border)] shadow-sm mb-5">
                <div className="relative h-[220px] md:h-[280px] lg:h-[300px]">
                  <img
                    src={selectedYear.image_url}
                    alt={selectedYear.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/75 font-semibold">
                      {selectedYear.year}
                    </p>

                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-none mt-2">
                      {selectedYear.title}
                    </h2>

                    {selectedYear.subtitle && (
                      <p className="text-white/90 text-base md:text-lg font-semibold mt-2 max-w-2xl">
                        {selectedYear.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <p className="text-black text-sm md:text-base leading-7 max-w-4xl">
                    {selectedYear.description}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-3xl bg-white border border-[var(--color-container-border)] shadow-sm p-5 md:p-6">
              <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                    {selectedYear?.year}
                  </p>

                  <h3 className="text-3xl md:text-4xl font-extrabold text-secondary leading-none mt-1">
                    {viewMode === 'moments'
                      ? 'Iconic Moments'
                      : 'Historic Players'}
                  </h3>
                </div>

                <p className="text-sm text-black/70 font-semibold">
                  {activeContent.length}{' '}
                  {viewMode === 'moments' ? 'moments' : 'players'}
                </p>
              </div>

              {loadingContent ? (
                <section className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
                </section>
              ) : isContentEmpty ? (
                <div className="rounded-2xl bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] p-8 text-center">
                  <p className="text-2xl font-extrabold text-secondary">
                    No content yet
                  </p>
                  <p className="text-black mt-2">
                    There is no legacy content registered for this era.
                  </p>
                </div>
              ) : viewMode === 'moments' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {moments.map((moment) => (
                    <article
                      key={moment.id}
                      className="rounded-2xl overflow-hidden bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] shadow-sm"
                    >
                      <div className="relative h-[170px]">
                        <img
                          src={moment.image_url}
                          alt={moment.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">
                          {moment.subtitle ?? `${moment.year}`}
                        </p>

                        <h4 className="text-2xl font-extrabold text-secondary leading-tight line-clamp-2">
                          {moment.title}
                        </h4>

                        <p className="text-black text-sm leading-6 mt-3 line-clamp-4">
                          {moment.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <article
                      key={player.id}
                      className="rounded-2xl overflow-hidden bg-[var(--color-text-light-soft)] border border-[var(--color-container-border)] shadow-sm"
                    >
                      <div className="relative h-[170px]">
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

                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2 line-clamp-1">
                          {player.role ?? 'Warriors Legend'}
                        </p>

                        <h4 className="text-2xl font-extrabold text-secondary leading-tight line-clamp-2">
                          {player.name}
                        </h4>

                        <p className="text-black text-sm leading-6 mt-3 line-clamp-4">
                          {player.highlight_text ?? player.bio}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Legacy;
