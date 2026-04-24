import { useWarriorsNews } from "../../hooks/useWarriorsNews";
import type { WarriorsNewsItem } from "../../hooks/warriorsNews";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsCard({ item }: { item: WarriorsNewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-72 flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative h-44 bg-secondary overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-surface-dark" />
        )}
        <span className="absolute top-3 left-3 font-lato text-[0.6rem] font-black uppercase tracking-[0.16em] text-white bg-black/40 px-2 py-1 rounded-full">
          {timeAgo(item.publishedAt)}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-anton text-base text-secondary leading-tight line-clamp-2 group-hover:text-primary-dark transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="font-lato text-xs text-text-light line-clamp-2">{item.description}</p>
        )}
      </div>
    </a>
  );
}

export default function NewsSection() {
  const { news, loading } = useWarriorsNews(6);

  return (
    <section aria-labelledby="news-heading">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-text-light mb-1">
            From the team
          </p>
          <h2 id="news-heading" className="font-anton text-4xl text-secondary uppercase">
            Warriors News
          </h2>
        </div>
        <a
          href="https://www.nba.com/warriors/news"
          target="_blank"
          rel="noopener noreferrer"
          className="font-lato text-sm font-bold text-secondary hover:text-primary-dark transition-colors hidden sm:block"
        >
          View all ↗
        </a>
      </div>

      {loading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-64 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      )}

      {!loading && news.length === 0 && (
        <p className="font-lato text-sm text-text-light">No news available right now.</p>
      )}

      {!loading && news.length > 0 && (
        <div className="-mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {news.map((item) => (
              <div key={item.id} className="snap-start">
                <NewsCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
