import Rail from "./Rail";
import { useWarriorsNews } from "../../hooks/useWarriorsNews";
import type { WarriorsNewsItem } from "../../hooks/warriorsNews";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsRailCard({ item }: { item: WarriorsNewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative shrink-0 w-[280px] h-[320px] overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={item.title}
    >
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-lato text-xs uppercase tracking-wider text-white/60 mb-1">
          {timeAgo(item.publishedAt)}
        </p>
        <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">
          {item.title}
        </h3>
      </div>
    </a>
  );
}

export default function NewsSection() {
  const { news, loading } = useWarriorsNews(6);

  return (
    <Rail title="Warriors News">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[280px] h-[320px] animate-pulse rounded-2xl bg-gray-200" />
          ))
        : news.length === 0
        ? [
            <div key="empty" className="w-full h-[320px] rounded-2xl bg-gray-100 flex items-center justify-center">
              <p className="font-lato text-sm text-text-light">No news available</p>
            </div>,
          ]
        : news.map((item) => (
            <div key={item.id} className="snap-start shrink-0">
              <NewsRailCard item={item} />
            </div>
          ))}
    </Rail>
  );
}
