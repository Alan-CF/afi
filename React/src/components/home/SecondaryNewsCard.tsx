import { Link } from "react-router-dom";
import type { WarriorsNewsItem } from "../../hooks/warriorsNews";
import { articleSlug } from "../../hooks/useNewsArticle";
import NewsImageOrFallback from "./NewsImageOrFallback";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SecondaryNewsCard({ article }: { article: WarriorsNewsItem }) {
  return (
    <Link
      to={`/news/${articleSlug(article.id)}`}
      className="group flex h-full rounded-2xl bg-white border border-container-border overflow-hidden lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={article.title}
    >
      <div className="relative w-[120px] sm:w-[140px] shrink-0 overflow-hidden bg-secondary">
        <NewsImageOrFallback thumbnail={article.thumbnail} alt="" />
      </div>
      <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0 gap-2">
        <div>
          <p className="font-lato text-[0.625rem] font-bold uppercase tracking-[0.14em] text-text-light mb-1.5">
            Warriors News
          </p>
          <h3 className="font-anton text-base md:text-lg text-secondary leading-tight line-clamp-3 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </div>
        <p className="font-lato text-xs text-text-light">
          {timeAgo(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
