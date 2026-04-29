import { Link } from 'react-router-dom';
import { useWarriorsNews } from '../../hooks/useWarriorsNews';
import { useProfile } from '../../hooks/useProfile';
import EmptyState from '../common/EmptyState';
import FeaturedNewsCard from './FeaturedNewsCard';
import SecondaryNewsCard from './SecondaryNewsCard';
import CompactNewsCard from './CompactNewsCard';

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader() {
  return (
    <div className="relative z-10 flex items-baseline justify-between mb-4 md:mb-5">
      <Link
        to="/news"
        className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      >
        Latest News
      </Link>
      <Link
        to="/news"
        className="font-lato text-sm font-bold text-text-light hover:text-secondary transition-colors shrink-0"
      >
        See all
      </Link>
    </div>
  );
}

export default function HomeTopNews() {
  const { news, loading } = useWarriorsNews(6);
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;

  const greeting =
    isLoggedIn && user ? (
      <p className="font-lato text-sm text-text-light mb-3 md:mb-4">
        {getTimeOfDay()},{' '}
        <span className="font-semibold text-secondary">{user.name}</span>.
      </p>
    ) : null;

  if (loading) {
    return (
      <section aria-label="Latest News">
        {greeting}
        <SectionHeader />
        <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)] md:items-start lg:items-stretch gap-5 lg:gap-6">
          <div className="lg:h-[452px] rounded-3xl aspect-[5/4] lg:aspect-auto skeleton-shimmer" />
          <div className="flex flex-col gap-4 lg:h-[452px] lg:grid lg:grid-rows-3 lg:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-[132px] lg:h-full skeleton-shimmer"
              />
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
      <section aria-label="Latest News">
        {greeting}
        <SectionHeader />
        <EmptyState message="Press box is quiet. New stories drop every game day." />
      </section>
    );
  }

  const featured = news[0];
  const secondary = news.slice(1, 4);
  const compactMobile = news.slice(1, 5);

  return (
    <section aria-label="Latest News">
      {greeting}
      <SectionHeader />

      <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)] md:items-start lg:items-stretch gap-5 lg:gap-6">
        <div className="min-w-0 lg:h-[452px] fade-in-up stagger-1">
          <FeaturedNewsCard article={featured} variant="home" />
        </div>
        <div className="min-w-0 flex flex-col gap-4 lg:h-[452px] lg:grid lg:grid-rows-3 lg:gap-4">
          {secondary.map((article, i) => (
            <div
              key={article.id}
              className={`lg:min-h-0 fade-in-up stagger-${i + 2}`}
            >
              <SecondaryNewsCard article={article} className="lg:h-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        <div className="fade-in-up stagger-1">
          <FeaturedNewsCard article={featured} variant="home" />
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
