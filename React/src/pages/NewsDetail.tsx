import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/solid';
import ScoreboardRibbon from '../components/layout/ScoreboardRibbon';
import EmptyState from '../components/common/EmptyState';
import LiveBadge from '../components/common/LiveBadge';
import CompactNewsCard from '../components/home/CompactNewsCard';
import NewsImageOrFallback from '../components/home/NewsImageOrFallback';
import { useNewsArticle } from '../hooks/useNewsArticle';
import {
  fetchScrapedArticle,
  type ScrapedArticle,
} from '../services/newsScraper';
import {
  normalizeImageUrl,
  type WarriorsNewsImage,
} from '../hooks/warriorsNews';

function formatPublished(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

function BodySkeleton() {
  return (
    <div className="w-full rounded-3xl bg-white border border-container-border shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-primary" />
      <div className="px-6 py-8 md:px-12 md:py-12">
        <div className="mb-5 flex items-center gap-3">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <p className="font-lato text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Obtaining full article from original source
          </p>
        </div>
        <p className="mb-6 font-lato text-sm md:text-base text-text-light leading-relaxed">
          We're pulling the story body from ESPN. This usually takes a few seconds.
        </p>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
          ))}
          <div className="h-4 w-2/3 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

const JUNK_PATTERNS: RegExp[] = [
  /^gambling problem\??/i,
  /^copyright\s*:?/i,
  /^©/,
  /^items per page\s*:?/i,
  /^go to page\s*:?/i,
  /^advertisement$/i,
  /^read more on/i,
  /^subscribe(\s+to)?\b/i,
];

function isJunk(p: string): boolean {
  return JUNK_PATTERNS.some((re) => re.test(p));
}

function normalizeForCompare(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isQuoteParagraph(p: string): boolean {
  const t = p.trim();
  return (
    t.startsWith('"') ||
    t.startsWith('“') ||
    t.startsWith('‘') ||
    t.startsWith('„')
  );
}

function startsWithAllCapsRun(p: string): boolean {
  return /^[A-Z][A-Z0-9'’\-]+\s+[A-Z][A-Z0-9'’\-]+/.test(p.trim());
}

function imageKey(url: string | null | undefined): string {
  const normalized = normalizeImageUrl(url);
  return normalized ? normalized.toLowerCase() : '';
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { article, relatedArticles, loading, error } = useNewsArticle(
    slug ?? null
  );

  const [scraped, setScraped] = useState<ScrapedArticle | null>(null);
  const [scrapedLoading, setScrapedLoading] = useState(false);
  const [scrapedAttempted, setScrapedAttempted] = useState(false);

  useEffect(() => {
    if (!article) {
      setScraped(null);
      setScrapedLoading(false);
      setScrapedAttempted(false);
      return;
    }
    const controller = new AbortController();
    setScraped(null);
    setScrapedLoading(true);
    setScrapedAttempted(false);
    fetchScrapedArticle(article.id, article, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setScraped(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setScraped(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setScrapedLoading(false);
          setScrapedAttempted(true);
        }
      });
    return () => {
      controller.abort();
    };
  }, [article]);

  const isBreaking =
    !!article &&
    Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  const heroImage = article ? (article.image ?? article.thumbnail) : null;
  const heroKey = imageKey(heroImage);
  const secondaryImage: WarriorsNewsImage | null =
    article?.gallery?.find(
      (img) => img.url && imageKey(img.url) && imageKey(img.url) !== heroKey
    ) ?? null;

  const author = scraped?.author ?? article?.author;
  const sourceLabel = scraped?.source ?? article?.sourceName ?? article?.source;
  const originalUrl = article?.originalUrl ?? article?.link;
  const body = scraped?.body ?? article?.body ?? null;

  function splitBody(raw: string): string[] {
    const byBlank = raw
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (byBlank.length > 1) return byBlank;
    return raw
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  const rawParagraphs: string[] =
    scraped?.bodyParagraphs && scraped.bodyParagraphs.length > 0
      ? scraped.bodyParagraphs
      : body
        ? splitBody(body)
        : [];

  const titleKey = article ? normalizeForCompare(article.title) : '';
  const cleanParagraphs = rawParagraphs.filter((p, i) => {
    if (isJunk(p)) return false;
    if (i < 2 && titleKey.length > 10) {
      const pKey = normalizeForCompare(p);
      if (pKey === titleKey || pKey.startsWith(titleKey)) return false;
    }
    return true;
  });

  const extractorFailed = scrapedAttempted && cleanParagraphs.length === 0;
  const isVideoArticle = !!originalUrl && /\/video\/clip\//i.test(originalUrl);
  const imageInsertIndex =
    secondaryImage && cleanParagraphs.length >= 4
      ? Math.max(1, Math.floor(cleanParagraphs.length * 0.4))
      : -1;

  function renderParagraph(p: string, key: string) {
    if (isQuoteParagraph(p)) {
      return (
        <blockquote
          key={key}
          className="my-2 border-l-4 border-primary bg-primary/5 rounded-r-2xl pl-6 pr-5 py-4 font-lato text-lg md:text-2xl text-secondary leading-9 md:leading-10 font-medium italic"
        >
          {p}
        </blockquote>
      );
    }
    if (startsWithAllCapsRun(p)) {
      return (
        <p
          key={key}
          className="font-lato text-base md:text-lg text-secondary leading-8 md:leading-9 font-semibold"
        >
          {p}
        </p>
      );
    }
    return (
      <p
        key={key}
        className="font-lato text-base md:text-lg text-secondary leading-8 md:leading-9"
      >
        {p}
      </p>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="flex-1 mx-auto w-full max-w-[1024px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        <button
          type="button"
          onClick={() => navigate('/news')}
          className="mb-6 inline-flex items-center gap-2 font-lato text-sm font-bold text-secondary hover:text-[#5780AE] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to News
        </button>

        {loading && <ArticleSkeleton />}

        {!loading && (error || !article) && (
          <EmptyState
            message="We couldn't find that story."
            cta={{ label: 'Back to News', onClick: () => navigate('/news') }}
          />
        )}

        {!loading && article && (
          <article>
            <div className="relative aspect-[4/5] md:aspect-[16/9] rounded-3xl overflow-hidden bg-secondary fade-in-up stagger-1">
              <NewsImageOrFallback
                thumbnail={heroImage ?? null}
                alt={article.title}
              />
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
                <p className="mt-4 font-lato text-base md:text-lg text-text leading-relaxed">
                  {article.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-lato text-sm text-text-light">
                {author && (
                  <span>
                    By{' '}
                    <span className="font-semibold text-secondary">
                      {author}
                    </span>
                  </span>
                )}
                {author && sourceLabel && <span aria-hidden>·</span>}
                {sourceLabel && <span>{sourceLabel}</span>}
                {(author || sourceLabel) && <span aria-hidden>·</span>}
                <span>{formatPublished(article.publishedAt)}</span>
              </div>
            </header>

            <div className="mt-8 md:mt-10 fade-in-up stagger-3">
              {scrapedLoading && cleanParagraphs.length === 0 && (
                <BodySkeleton />
              )}

              {!scrapedLoading && cleanParagraphs.length > 0 && (
                <div className="w-full rounded-3xl bg-white border border-container-border shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-primary" />
                  <div className="px-6 py-8 md:px-12 md:py-12">
                    <div className="flex flex-col gap-6 md:gap-7">
                      {cleanParagraphs.map((p, i) => (
                        <Fragment key={`p-${i}`}>
                          {i === imageInsertIndex && secondaryImage && (
                            <figure className="my-4 -mx-6 md:-mx-12">
                              <div className="relative aspect-[16/9] overflow-hidden bg-secondary/10 shadow-sm">
                                <NewsImageOrFallback
                                  thumbnail={secondaryImage.url}
                                  alt={secondaryImage.caption ?? article.title}
                                />
                              </div>
                              {secondaryImage.caption && (
                                <figcaption className="mt-3 px-6 md:px-12 font-lato text-xs md:text-sm text-text-light italic text-center">
                                  {secondaryImage.caption}
                                </figcaption>
                              )}
                            </figure>
                          )}
                          {renderParagraph(p, `p-${i}`)}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!scrapedLoading && cleanParagraphs.length === 0 && (
                <div className="w-full rounded-3xl bg-white border border-container-border shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-primary" />
                  <div className="px-6 py-8 md:px-12 md:py-12">
                    {isVideoArticle && (
                      <p className="mb-3 font-lato text-xs font-bold uppercase tracking-[0.18em] text-primary">
                        Video Story
                      </p>
                    )}
                    <p className="font-lato text-base md:text-lg text-secondary leading-relaxed">
                      {isVideoArticle
                        ? 'This story plays as a video. Watch the full clip on ESPN.'
                        : extractorFailed
                          ? 'Unable to load full content. Read the complete article from the original source.'
                          : 'Full article content is available from the original source.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {originalUrl && (
              <div className="mt-8 md:mt-10 w-full flex flex-col sm:flex-row gap-3 fade-in-up stagger-4">
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 font-lato text-sm font-bold text-white hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  {isVideoArticle ? 'Watch on ESPN' : 'Read original source'}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/news')}
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
                    <div
                      key={item.id}
                      className={`fade-in-up stagger-${Math.min(i + 1, 6)}`}
                    >
                      <CompactNewsCard article={item} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
