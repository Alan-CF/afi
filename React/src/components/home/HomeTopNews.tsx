import { useWarriorsNews } from "../../hooks/useWarriorsNews";
import { useProfile } from "../../hooks/useProfile";
import EmptyState from "../common/EmptyState";
import FeaturedNewsCard from "./FeaturedNewsCard";
import SecondaryNewsCard from "./SecondaryNewsCard";
import CompactNewsCard from "./CompactNewsCard";

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeTopNews() {
  const { news, loading } = useWarriorsNews(6);
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;

  const greeting = isLoggedIn && user ? (
    <p className="font-lato text-sm text-text-light mb-3 md:mb-4">
      {getTimeOfDay()}, <span className="font-semibold text-secondary">@{user.username}</span>.
    </p>
  ) : null;

  if (loading) {
    return (
      <section aria-label="Top News">
        {greeting}
        <div className="hidden md:grid grid-cols-12 gap-6">
          <div className="col-span-7 rounded-3xl aspect-[16/9] skeleton-shimmer" />
          <div className="col-span-5 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-[175px] skeleton-shimmer" />
            ))}
          </div>
        </div>
        <div className="md:hidden flex flex-col gap-4">
          <div className="rounded-3xl aspect-[4/5] skeleton-shimmer" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section aria-label="Top News">
        {greeting}
        <EmptyState message="Press box is quiet. New stories drop every game day." />
      </section>
    );
  }

  const featured = news[0];
  const rest = news.slice(1);
  const secondary = rest.slice(0, 3);
  const compactDesktop = rest.slice(3, 5);
  const compactMobile = rest.slice(0, 4);

  return (
    <section aria-label="Top News">
      {greeting}

      <div className="hidden md:grid grid-cols-12 gap-6">
        <div className="col-span-7 fade-in-up stagger-1">
          <FeaturedNewsCard article={featured} />
        </div>
        <div className="col-span-5 flex flex-col gap-4">
          {secondary.map((article, i) => (
            <div key={article.id} className={`fade-in-up stagger-${i + 2}`}>
              <SecondaryNewsCard article={article} />
            </div>
          ))}
        </div>
      </div>

      {compactDesktop.length > 0 && (
        <div className="hidden md:grid grid-cols-2 gap-4 mt-4">
          {compactDesktop.map((article, i) => (
            <div key={article.id} className={`fade-in-up stagger-${i + 5}`}>
              <CompactNewsCard article={article} />
            </div>
          ))}
        </div>
      )}

      <div className="md:hidden flex flex-col gap-4">
        <div className="fade-in-up stagger-1">
          <FeaturedNewsCard article={featured} />
        </div>
        <div className="flex flex-col">
          {compactMobile.map((article, i) => (
            <div key={article.id} className={`fade-in-up stagger-${i + 2}`}>
              <CompactNewsCard article={article} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
