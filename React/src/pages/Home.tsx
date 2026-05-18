import { Link, useNavigate } from 'react-router-dom';
import {
  FireIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/solid';
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
      icon: UserGroupIcon,
      label: 'Rooms',
      desc: 'Join the conversation',
      to: '/rooms',
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
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className={`group relative flex flex-row items-center gap-2 md:gap-3 rounded-2xl bg-white border border-container-border px-3 py-2.5 md:px-4 md:py-3 text-left lift-on-hover hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow overflow-hidden fade-in-up stagger-${i + 1}`}
          >
            <span className="absolute top-0 left-0 bottom-0 w-1 bg-primary opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-white transition-colors group-hover:bg-secondary/90">
              <a.icon className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-anton text-sm md:text-base text-secondary leading-tight truncate">
                {a.label}
              </p>
              <p className="font-lato text-[0.65rem] md:text-xs text-text-light hidden sm:block truncate">
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

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        {isLoggedIn && user && (
          <p className="font-lato text-sm text-text-light mb-4 md:mb-5">
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
