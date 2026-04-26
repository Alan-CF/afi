import { useState } from "react";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import { useWarriorsNews } from "../hooks/useWarriorsNews";
import type { WarriorsNewsItem } from "../hooks/warriorsNews";
import LiveBadge from "../components/common/LiveBadge";
import EmptyState from "../components/common/EmptyState";
import FeaturedNewsCard from "../components/home/FeaturedNewsCard";
import SecondaryNewsCard from "../components/home/SecondaryNewsCard";
import NewsImageOrFallback from "../components/home/NewsImageOrFallback";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ArticleCard({ article, className = "" }: { article: WarriorsNewsItem; className?: string }) {
  const breaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-3xl overflow-hidden bg-white border border-container-border lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      aria-label={article.title}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <NewsImageOrFallback thumbnail={article.thumbnail} alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
        {breaking && <div className="absolute top-3 right-3"><LiveBadge label="BREAKING" /></div>}
      </div>
      <div className="p-5 flex flex-col gap-2">
        <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-text-light">Warriors</p>
        <h3 className="font-anton text-lg md:text-xl text-secondary leading-tight line-clamp-3 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
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
  const topStories = news.slice(1, 5);
  const grid = news.slice(5, 5 + visible);
  const hasMore = 5 + visible < news.length;

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
            <div className="aspect-[4/5] md:aspect-[16/9] rounded-3xl skeleton-shimmer" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[180px] rounded-2xl skeleton-shimmer" />
              ))}
            </div>
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
            <div className="fade-in-up stagger-2"><FeaturedNewsCard article={hero} /></div>

            {topStories.length > 0 && (
              <>
                <h2 className="font-anton text-3xl md:text-4xl text-secondary mt-12 md:mt-16 mb-4 md:mb-6 fade-in-up stagger-3">
                  Top Stories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topStories.map((article, i) => (
                    <div key={article.id} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                      <SecondaryNewsCard article={article} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {grid.length > 0 && (
              <>
                <h2 className="font-anton text-3xl md:text-4xl text-secondary mt-16 md:mt-20 mb-4 md:mb-6 fade-in-up stagger-3">
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
