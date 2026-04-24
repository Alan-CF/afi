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
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="font-anton text-3xl md:text-4xl text-secondary lowercase tracking-tight">
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
    { icon: <UserGroupIcon className="h-7 w-7" />, label: "join room", onClick: () => navigate("/rooms") },
    { icon: <BoltIcon className="h-7 w-7" />, label: "predict", onClick: () => navigate("/rooms") },
    {
      icon: <LinkIcon className="h-7 w-7" />,
      label: "invite",
      onClick: () => void navigator.clipboard.writeText(`${window.location.origin}/rooms`).catch(() => {}),
    },
  ];

  return (
    <div className="flex justify-around md:justify-start md:gap-16">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="flex flex-col items-center gap-2 group focus:outline-none"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-secondary transition-colors group-hover:bg-primary group-hover:text-white">
            {a.icon}
          </span>
          <span className="font-anton text-sm text-secondary lowercase group-hover:text-primary transition-colors">
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
          <div className="pt-4 pb-2">
            <GreetingStrip />
          </div>
        )}

        <div className="mt-10">
          <EventsSlider />
        </div>

        <div className="mt-20 md:mt-24">
          <QuickActions />
        </div>

        <div className="mt-20 md:mt-24">
          <FanaticTodayCard />
        </div>

        <div className="mt-20 md:mt-24">
          <QuizOfTheWeekCard />
        </div>

        <div className="mt-20 md:mt-24 grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <SectionTitle title="rooms" to="/rooms" />
            <RoomsPreview />
          </div>
          <div>
            <SectionTitle title="leaderboard" to="/ranking" />
            <LeaderboardPreview />
          </div>
        </div>

        <div className="mt-20 md:mt-24">
          <SectionTitle title="news" />
          <NewsSection />
        </div>

        <div className="mt-20 md:mt-24">
          <SectionTitle title="shop" to="/shop" />
          <ShopSpotlight />
        </div>

        {!isLoggedIn && hasLoadedOnce && (
          <div className="mt-20 md:mt-24">
            <CTABanner />
          </div>
        )}

      </main>

      <div className="mt-20 md:mt-24">
        <Footer />
      </div>
    </div>
  );
}
