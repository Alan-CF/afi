import { Link } from "react-router-dom";
import LiveBadge from "../common/LiveBadge";
import type { WarriorsNewsItem } from "../../hooks/warriorsNews";
import { articleSlug } from "../../hooks/useNewsArticle";
import NewsImageOrFallback from "./NewsImageOrFallback";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function FeaturedNewsCard({ article }: { article: WarriorsNewsItem }) {
  const isBreaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  return (
    <Link
      to={`/news/${articleSlug(article.id)}`}
      className="group relative block overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[16/9] bg-secondary lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={article.title}
    >
      <NewsImageOrFallback thumbnail={article.thumbnail} alt="" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />

      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 text-white max-w-full md:max-w-[68%]">
        <div className="mb-3">
          {isBreaking ? (
            <LiveBadge label="BREAKING" />
          ) : (
            <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Warriors News
            </p>
          )}
        </div>
        <h2 className="font-anton text-3xl md:text-5xl leading-tight line-clamp-3">
          {article.title}
        </h2>
        <p className="mt-3 font-lato text-sm text-white/55">{timeAgo(article.publishedAt)}</p>
        <p className="mt-1 font-lato text-sm text-white/55 group-hover:text-white/80 transition-colors">
          Read article →
        </p>
      </div>
    </Link>
  );
}
