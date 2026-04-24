import { useNavigate } from "react-router-dom";
import { UserGroupIcon, BoltIcon, LinkIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import GreetingStrip from "../components/home/GreetingStrip";
import EventsSlider from "../components/home/EventsSlider";
import FanaticTodayCard from "../components/home/FanaticTodayCard";
import QuizOfTheWeekCard from "../components/home/QuizOfTheWeekCard";
import RoomsPreview from "../components/home/RoomsPreview";
import LeaderboardPreview from "../components/home/LeaderboardPreview";
import NewsSection from "../components/home/NewsSection";
import ShopSpotlight from "../components/home/ShopSpotlight";
import CTABanner from "../components/home/CTABanner";
import { useProfile } from "../hooks/useProfile";

function SectionTitle({ title, to }: { title: string; to?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-baseline justify-between mb-4 md:mb-6">
      <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
        {title}
      </h2>
      {to && (
        <button
          type="button"
          onClick={() => navigate(to)}
          className="font-anton text-xl text-secondary hover:text-primary transition-colors"
          aria-label={`See all ${title}`}
        >
          →
        </button>
      )}
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: <UserGroupIcon className="h-8 w-8" />, label: "Join Room", sub: "Enter a live watch-party", onClick: () => navigate("/rooms") },
    { icon: <BoltIcon className="h-8 w-8" />, label: "Predict", sub: "Make your picks", onClick: () => navigate("/rooms") },
    {
      icon: <LinkIcon className="h-8 w-8" />,
      label: "Invite",
      sub: "Copy a shareable link",
      onClick: () => void navigator.clipboard.writeText(`${window.location.origin}/rooms`).catch(() => {}),
    },
  ];

  return (
    <div>
      <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight mb-4 md:mb-6">
        Quick Actions
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-container-border bg-white p-4 md:p-6 text-center shadow-sm hover:border-primary hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary/10 text-secondary group-hover:bg-primary/20 transition-colors">
              {a.icon}
            </span>
            <div>
              <p className="font-lato text-sm md:text-base font-bold text-secondary group-hover:text-primary transition-colors">
                {a.label}
              </p>
              <p className="font-lato text-xs text-text-light mt-0.5 hidden md:block">
                {a.sub}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatsPromo() {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate("/stats")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("/stats")}
      className="group relative overflow-hidden rounded-3xl aspect-[21/9] md:aspect-[3/1] bg-secondary flex items-end cursor-pointer"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(ellipse at 80% 30%, #1a3a6e 0%, #0a1628 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
      <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <ChartBarIcon className="h-32 w-32 md:h-48 md:w-48 text-primary" />
      </div>
      <div className="relative z-10 p-8 md:p-12 flex flex-col gap-3 max-w-lg">
        <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Season Stats
        </p>
        <h2 className="font-anton text-2xl md:text-3xl text-white leading-tight">
          Analyze the 2025–26 Warriors season
        </h2>
        <p className="font-lato text-sm text-white/60 group-hover:text-white/80 transition-colors">
          Explore stats →
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-6 lg:px-8">

        {isLoggedIn && (
          <GreetingStrip />
        )}

        <div className={isLoggedIn ? "mt-6" : "mt-10"}>
          <EventsSlider />
        </div>

        <div className="mt-16 md:mt-20">
          <QuickActions />
        </div>

        <div className="mt-16 md:mt-20">
          <FanaticTodayCard />
        </div>

        <div className="mt-16 md:mt-20">
          <QuizOfTheWeekCard />
        </div>

        <div className="mt-16 md:mt-20 grid grid-cols-1 gap-16 lg:grid-cols-2">
          <RoomsPreview />
          <div>
            <SectionTitle title="Leaderboard" />
            <LeaderboardPreview />
          </div>
        </div>

        <div className="mt-16 md:mt-20">
          <NewsSection />
        </div>

        <div className="mt-16 md:mt-20">
          <StatsPromo />
        </div>

        <div className="mt-16 md:mt-20">
          <SectionTitle title="Warriors Shop" />
          <ShopSpotlight />
        </div>

        {!isLoggedIn && hasLoadedOnce && (
          <div className="mt-16 md:mt-20">
            <CTABanner />
          </div>
        )}

      </main>

      <div className="mt-16 md:mt-20">
        <Footer />
      </div>
    </div>
  );
}
