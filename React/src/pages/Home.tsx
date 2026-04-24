import { useNavigate } from "react-router-dom";
import { UserGroupIcon, BoltIcon, LinkIcon } from "@heroicons/react/24/solid";
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
    { icon: <UserGroupIcon className="h-6 w-6" />, label: "Join Room", onClick: () => navigate("/rooms") },
    { icon: <BoltIcon className="h-6 w-6" />, label: "Predict", onClick: () => navigate("/rooms") },
    {
      icon: <LinkIcon className="h-6 w-6" />,
      label: "Invite",
      onClick: () => void navigator.clipboard.writeText(`${window.location.origin}/rooms`).catch(() => {}),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-6">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl py-2"
          
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-secondary transition-colors group-hover:bg-primary/20">
            {a.icon}
          </span>
          <span className="font-lato text-sm font-bold text-secondary group-hover:text-primary transition-colors">
            {a.label}
          </span>
        </button>
      ))}
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
            <SectionTitle title="Leaderboard" to="/ranking" />
            <LeaderboardPreview />
          </div>
        </div>

        <div className="mt-16 md:mt-20">
          <NewsSection />
        </div>

        <div className="mt-16 md:mt-20">
          <SectionTitle title="Warriors Shop" to="/shop" />
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
