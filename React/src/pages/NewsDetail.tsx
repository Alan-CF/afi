import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import EmptyState from "../components/common/EmptyState";
import LiveBadge from "../components/common/LiveBadge";
import CompactNewsCard from "../components/home/CompactNewsCard";
import NewsImageOrFallback from "../components/home/NewsImageOrFallback";
import { useNewsArticle } from "../hooks/useNewsArticle";
import { fetchScrapedArticle, type ScrapedArticle } from "../services/newsScraper";

function formatPublished(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ArticleSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="aspect-[4/5] md:aspect-[16/9] rounded-3xl skeleton-shimmer" />
      <div className="h-10 w-3/4 rounded skeleton-shimmer" />
      <div className="h-4 w-40 rounded skeleton-shimmer" />
      <div className="flex flex-col gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { article, relatedArticles, loading, error } = useNewsArticle(slug ?? null);

  const [scraped, setScraped] = useState<ScrapedArticle | null>(null);
  const [scrapedLoading, setScrapedLoading] = useState(false);

  useEffect(() => {
    if (!article) return;
    let cancelled = false;
    const controller = new AbortController();
    setScrapedLoading(true);
    fetchScrapedArticle(article.id, article, controller.signal)
      .then((data) => {
        if (!cancelled) setScraped(data);
      })
      .catch(() => {
        if (!cancelled) setScraped(null);
      })
      .finally(() => {
        if (!cancelled) setScrapedLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [article]);

  const isBreaking =
    !!article && Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  const heroImage = article ? article.image ?? article.thumbnail : null;
  const author = article?.author;
  const sourceLabel = scraped?.source ?? article?.sourceName ?? article?.source;
  const originalUrl = article?.originalUrl ?? article?.link;
  const body = scraped?.body ?? article?.body ?? null;
  const bodyParagraphs = body
    ? body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1024px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        <button
          type="button"
          onClick={() => navigate("/news")}
          className="mb-6 inline-flex items-center gap-2 font-lato text-sm font-bold text-secondary hover:text-[#5780AE] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to News
        </button>

        {loading && <ArticleSkeleton />}

        {!loading && (error || !article) && (
          <EmptyState
            message="We couldn't find that story."
            cta={{ label: "Back to News", onClick: () => navigate("/news") }}
          />
        )}

        {!loading && article && (
          <article>
            <div className="relative aspect-[4/5] md:aspect-[16/9] rounded-3xl overflow-hidden bg-secondary fade-in-up stagger-1">
              <NewsImageOrFallback thumbnail={heroImage ?? null} alt={article.title} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              {isBreaking && (
                <div className="absolute top-5 left-5">
                  <LiveBadge label="BREAKING" />
                </div>
              )}
            </div>

            <header className="mt-6 md:mt-8 fade-in-up stagger-2">
              <p className="font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Warriors News
              </p>
              <h1 className="mt-3 font-anton text-3xl md:text-5xl text-secondary leading-tight">
                {article.title}
              </h1>
              {article.description && (
                <p className="mt-4 font-lato text-base md:text-lg text-text-light leading-relaxed">
                  {article.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-lato text-sm text-text-light">
                {author && (
                  <span>
                    By <span className="font-semibold text-secondary">{author}</span>
                  </span>
                )}
                {author && sourceLabel && <span aria-hidden>·</span>}
                {sourceLabel && <span>{sourceLabel}</span>}
                {(author || sourceLabel) && <span aria-hidden>·</span>}
                <span>{formatPublished(article.publishedAt)}</span>
              </div>
            </header>

            <div className="mt-8 md:mt-10 fade-in-up stagger-3">
              {scrapedLoading && bodyParagraphs.length === 0 && (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
                  ))}
                </div>
              )}

              {!scrapedLoading && bodyParagraphs.length > 0 && (
                <div className="flex flex-col gap-5 font-lato text-base md:text-lg text-text leading-8">
                  {bodyParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}

              {!scrapedLoading && bodyParagraphs.length === 0 && (
                <div className="rounded-3xl bg-white border border-container-border p-6 md:p-8">
                  <p className="font-lato text-base md:text-lg text-text-light leading-relaxed">
                    Full article content is available from the original source.
                  </p>
                </div>
              )}
            </div>

            {originalUrl && (
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 fade-in-up stagger-4">
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 font-lato text-sm font-bold text-white hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Read original source
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => navigate("/news")}
                  className="inline-flex items-center justify-center rounded-2xl border border-secondary/30 px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-secondary/5 transition-colors"
                >
                  More stories
                </button>
              </div>
            )}

            {relatedArticles.length > 0 && (
              <section className="mt-16 md:mt-20">
                <h2 className="font-anton text-2xl md:text-3xl text-secondary leading-tight mb-4 md:mb-6">
                  Related Stories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedArticles.map((item, i) => (
                    <div key={item.id} className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                      <CompactNewsCard article={item} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
