import { useNavigate } from "react-router-dom";
import {
  FireIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import HomeTopNews from "../components/home/HomeTopNews";
import HomeEventsSection from "../components/home/HomeEventsSection";
import HomeFanaticFeature from "../components/home/HomeFanaticFeature";
import HomeRoomsRail from "../components/home/HomeRoomsRail";
import HomeLeaderboardPreview from "../components/home/HomeLeaderboardPreview";
import HomeStatsPreview from "../components/home/HomeStatsPreview";
import ShopSpotlight from "../components/home/ShopSpotlight";
import HomeAuthCTA from "../components/home/HomeAuthCTA";

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: FireIcon,        label: "Fanatic",  desc: "Play the daily challenge",  to: "/fanatic"  },
    { icon: UserGroupIcon,   label: "Rooms",    desc: "Join a live watch party",   to: "/rooms"    },
    { icon: AcademicCapIcon, label: "Quizzes",  desc: "Test your Warriors IQ",     to: "/quizzes"  },
  ];

  return (
    <section className="mt-16 md:mt-20">
      <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight mb-4 md:mb-6">
        Jump In
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className={`group flex flex-col items-start gap-3 md:gap-4 rounded-3xl bg-white border border-container-border p-4 md:p-6 text-left lift-on-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow fade-in-up stagger-${i + 1}`}
          >
            <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-primary/[0.12] text-secondary transition-colors group-hover:bg-primary/[0.20]">
              <a.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-anton text-lg md:text-xl text-secondary leading-tight">{a.label}</p>
              <p className="mt-0.5 font-lato text-xs text-text-light hidden md:block">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">
        <HomeTopNews />
        <HomeEventsSection />
        <QuickActions />
        <HomeFanaticFeature />
        <HomeRoomsRail />
        <HomeLeaderboardPreview />
        <HomeStatsPreview />

        <section className="mt-16 md:mt-20">
          <div className="flex items-baseline justify-between mb-4 md:mb-6">
            <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
              Warriors Shop
            </h2>
          </div>
          <ShopSpotlight />
        </section>

        <HomeAuthCTA />
      </main>

      <Footer />
    </div>
  );
}
