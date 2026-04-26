import { useState } from "react";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useWarriorsNews } from "../hooks/useWarriorsNews";
import type { WarriorsNewsItem } from "../hooks/warriorsNews";
import LiveBadge from "../components/common/LiveBadge";
import EmptyState from "../components/common/EmptyState";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsHero({ article }: { article: WarriorsNewsItem }) {
  const breaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary"
      aria-label={article.title}
    >
      {article.thumbnail
        ? <img src={article.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover object-top image-zoom" loading="eager" />
        : <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 80% 30%, #1a3a6e 0%, #060e1e 100%)" }} />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white max-w-full md:max-w-[60%]">
        <div className="mb-3">
          {breaking ? <LiveBadge label="BREAKING" /> : <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">Warriors News</p>}
        </div>
        <h2 className="font-anton text-3xl md:text-5xl leading-tight line-clamp-3">{article.title}</h2>
        <p className="mt-3 font-lato text-sm text-white/60 group-hover:text-white/80 transition-colors">
          {timeAgo(article.publishedAt)} · Read article →
        </p>
      </div>
    </a>
  );
}

function ArticleCard({ article, className = "" }: { article: WarriorsNewsItem; className?: string }) {
  const breaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-3xl overflow-hidden bg-white border border-container-border shadow-sm lift-on-hover ${className}`}
      aria-label={article.title}
    >
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        {article.thumbnail
          ? <img src={article.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover object-top image-zoom" loading="lazy" />
          : <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-anton text-[6rem] text-primary/20 select-none">W</span>
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
        {breaking && <div className="absolute top-3 right-3"><LiveBadge label="BREAKING" /></div>}
      </div>
      <div className="p-5 flex flex-col gap-2">
        <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light">Warriors</p>
        <h3 className="font-anton text-lg md:text-xl text-secondary leading-tight line-clamp-3">{article.title}</h3>
        <p className="font-lato text-xs text-text-light tabular-nums">{timeAgo(article.publishedAt)}</p>
      </div>
    </a>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-container-border">
      <div className="aspect-[4/5] skeleton-shimmer" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-5 w-full rounded skeleton-shimmer" />
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-16 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 12;

export default function News() {
  const { news, loading, error } = useWarriorsNews(20);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const hero = news[0] ?? null;
  const grid = news.slice(1, visible + 1);
  const hasMore = visible + 1 < news.length;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        <header className="mb-6 md:mb-8 fade-in-up stagger-1">
          <h1 className="font-anton text-4xl md:text-5xl text-secondary leading-tight">Warriors News</h1>
          <p className="mt-2 font-lato text-base text-text-light">Latest from the Dub Nation.</p>
        </header>

        {loading && (
          <>
            <div className="aspect-[4/5] md:aspect-[21/9] rounded-3xl skeleton-shimmer" />
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </>
        )}

        {!loading && error && (
          <EmptyState message="Press box went dark." cta={{ label: "Try again", onClick: () => window.location.reload() }} />
        )}

        {!loading && !error && !hero && (
          <EmptyState message="Press box is quiet right now. Check back at tip-off." />
        )}

        {!loading && !error && hero && (
          <>
            <div className="fade-in-up stagger-2"><NewsHero article={hero} /></div>

            {grid.length > 0 && (
              <>
                <h2 className="font-anton text-3xl md:text-4xl text-secondary mt-16 md:mt-20 mb-6 fade-in-up stagger-3">
                  More Stories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grid.map((article, i) => (
                    <ArticleCard key={article.id} article={article} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible(v => v + PAGE_SIZE)}
                      className="rounded-2xl border-2 border-secondary px-8 py-3 font-lato font-bold text-secondary hover:bg-secondary hover:text-white transition-colors lift-on-hover"
                    >
                      Load more stories
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
