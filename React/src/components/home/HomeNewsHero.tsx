import LiveBadge from "../common/LiveBadge";
import type { WarriorsNewsItem } from "../../hooks/warriorsNews";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HomeNewsHero({ article }: { article: WarriorsNewsItem }) {
  const isBreaking = Date.now() - new Date(article.publishedAt).getTime() < 60 * 60 * 1000;

  return (
    <section>
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[21/9] bg-secondary"
        aria-label={article.title}
      >
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top image-zoom"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden">
            <span
              className="font-anton text-primary opacity-[0.08] select-none leading-none"
              style={{ fontSize: "clamp(12rem, 40vw, 28rem)" }}
              aria-hidden
            >
              W
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white max-w-full md:max-w-[62%]">
          <div className="mb-3">
            {isBreaking
              ? <LiveBadge label="BREAKING" />
              : <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">Warriors News</p>}
          </div>
          <h2 className="font-anton text-3xl md:text-5xl leading-tight line-clamp-3">
            {article.title}
          </h2>
          <p className="mt-3 font-lato text-sm text-white/55">
            {timeAgo(article.publishedAt)}
          </p>
          <p className="mt-1 font-lato text-sm text-white/55 group-hover:text-white/80 transition-colors">
            Read article →
          </p>
        </div>
      </a>
    </section>
  );
}
