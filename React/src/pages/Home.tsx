import { Link, useNavigate } from "react-router-dom";
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
    { icon: FireIcon,        label: "Fanatic",  desc: "Keep playing",          to: "/fanatic"  },
    { icon: UserGroupIcon,   label: "Rooms",    desc: "Join the conversation", to: "/rooms"    },
    { icon: AcademicCapIcon, label: "Quizzes",  desc: "Test your IQ",          to: "/quizzes"  },
  ];

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <h2 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight mb-4 md:mb-5">
        Jump In
      </h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {actions.map((a, i) => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.to)}
            className={`group relative flex flex-col items-start gap-3 md:gap-4 rounded-3xl bg-white border border-container-border p-4 md:p-6 text-left lift-on-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow overflow-hidden fade-in-up stagger-${i + 1}`}
          >
            <span className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-secondary text-white transition-colors group-hover:bg-secondary/90">
              <a.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-anton text-lg md:text-xl text-secondary leading-tight">{a.label}</p>
              <p className="mt-1 font-lato text-xs md:text-sm text-text-light">
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

      <Footer />
    </div>
  );
}
