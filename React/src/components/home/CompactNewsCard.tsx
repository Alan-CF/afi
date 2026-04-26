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

export default function CompactNewsCard({ article }: { article: WarriorsNewsItem }) {
  return (
    <Link
      to={`/news/${articleSlug(article.id)}`}
      className="group flex items-center gap-3 py-3 border-b border-container-border last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      aria-label={article.title}
    >
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-secondary">
        <NewsImageOrFallback thumbnail={article.thumbnail} alt="" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-lato font-bold text-sm text-secondary line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="font-lato text-xs text-text-light mt-1">
          {timeAgo(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
