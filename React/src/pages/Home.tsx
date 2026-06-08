import { Link, useNavigate } from 'react-router-dom';
import { FireIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="50" cy="50" r="42" />
      <line x1="8" y1="50" x2="92" y2="50" />
      <line x1="50" y1="8" x2="50" y2="92" />
      <path d="M 50 8 Q 24 50, 50 92" />
      <path d="M 50 8 Q 76 50, 50 92" />
    </svg>
  );
}
import ScoreboardRibbon from '../components/layout/ScoreboardRibbon';
import HomeTopNews from '../components/home/HomeTopNews';
import HomeEventsSection from '../components/home/HomeEventsSection';
import HomeRoomsRail from '../components/home/HomeRoomsRail';
import ShopSpotlight from '../components/home/ShopSpotlight';
import HomeAuthCTA from '../components/home/HomeAuthCTA';
import { useProfile } from '../hooks/useProfile';

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: FireIcon, label: 'Fanatic', desc: 'Keep playing', to: '/fanatic' },
    {
      icon: BasketballIcon,
      label: 'Shoot Your Shot',
      desc: 'Take the shot',
      to: '/shoot-your-shot',
    },
    {
      icon: AcademicCapIcon,
      label: 'Quizzes',
      desc: 'Test your IQ',
      to: '/quizzes',
    },
  ];

  return (
    <section>
      <h2 className="font-anton text-lg md:text-xl text-secondary leading-tight mb-3 md:mb-4">
        Jump In
      </h2>
      <div className="flex md:grid md:grid-cols-3 gap-2 md:gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide scroll-pl-4 md:scroll-pl-0 -mx-4 md:mx-0 px-4 md:px-0 pb-1 md:pb-0">
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className={`group relative shrink-0 md:shrink w-[170px] md:w-auto snap-start flex flex-row items-center gap-2 md:gap-3 rounded-2xl bg-white border border-container-border px-3 py-2.5 md:px-4 md:py-3 text-left lift-on-hover hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow overflow-hidden fade-in-up stagger-${i + 1}`}
          >
            <span className="absolute top-0 left-0 bottom-0 w-1 bg-primary opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-white transition-colors group-hover:bg-secondary/90">
              <a.icon className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-anton text-sm md:text-base text-secondary leading-tight truncate">
                {a.label}
              </p>
              <p className="font-lato text-[0.65rem] md:text-xs text-text-light truncate">
                {a.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />

      <main className="w-full flex-1 px-4 sm:px-8 pt-4 md:pt-6 pb-16 md:pb-20">
        {isLoggedIn && user && (
          <p className="font-lato text-sm text-text-light mb-3 md:mb-4">
            {getTimeOfDay()},{' '}
            <span className="font-semibold text-secondary">
              {user.name ?? user.username}
            </span>
            .
          </p>
        )}

        {isLoggedIn && <QuickActions />}

        <div className={isLoggedIn ? 'mt-8 md:mt-10 lg:mt-12' : ''}>
          <HomeTopNews />
        </div>
        <HomeEventsSection />
        <HomeRoomsRail />

        <section className="mt-8 md:mt-10 lg:mt-12">
          <div className="mb-4 md:mb-5">
            <Link
              to="/shop"
              className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              Warriors Shop
            </Link>
          </div>
          <ShopSpotlight />
        </section>

        <HomeAuthCTA />
      </main>
    </div>
  );
}
