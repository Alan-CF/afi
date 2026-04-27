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

type Variant = "home" | "page";

interface Props {
  article: WarriorsNewsItem;
  variant?: Variant;
}

const SIZE: Record<Variant, string> = {
  home: "aspect-[4/5] md:aspect-auto md:h-[386px] lg:h-[452px]",
  page: "aspect-[4/5] md:aspect-[16/7] md:min-h-[420px] lg:min-h-[480px]",
};

const TITLE: Record<Variant, string> = {
  home: "font-anton text-2xl md:text-3xl leading-tight line-clamp-3",
  page: "font-anton text-3xl md:text-4xl lg:text-5xl leading-tight line-clamp-3",
};

const PADDING: Record<Variant, string> = {
  home: "p-5 md:p-7",
  page: "p-6 md:p-10 lg:p-12",
};

export default function FeaturedNewsCard({ article, variant = "page" }: Props) {
  const isBreaking =
    Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  return (
    <Link
      to={`/news/${articleSlug(article.id)}`}
      className={`group relative block w-full overflow-hidden rounded-3xl bg-secondary lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${SIZE[variant]}`}
      aria-label={article.title}
    >
      <NewsImageOrFallback thumbnail={article.thumbnail} alt="" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

      <div
        className={`relative h-full flex flex-col justify-end text-white max-w-full md:max-w-[70%] ${PADDING[variant]}`}
      >
        <div className="mb-2">
          {isBreaking ? (
            <LiveBadge label="BREAKING" />
          ) : (
            <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Warriors News
            </p>
          )}
        </div>
        <h2 className={TITLE[variant]}>{article.title}</h2>
        <p className="mt-2 font-lato text-xs md:text-sm text-white/55">
          {timeAgo(article.publishedAt)}
        </p>
        <p className="mt-1 font-lato text-xs md:text-sm text-white/55 group-hover:text-white/80 transition-colors">
          Read article →
        </p>
      </div>
    </Link>
  );
}
