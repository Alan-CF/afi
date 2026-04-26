import { useNavigate } from "react-router-dom";
import {
  FireIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import ScoreboardRibbon from "../components/layout/ScoreboardRibbon";
import Footer from "../components/layout/Footer";
import HomeGameCard from "../components/home/HomeGameCard";
import HomeNewsHero from "../components/home/HomeNewsHero";
import EventsSlider from "../components/home/EventsSlider";
import HomeFanaticFeature from "../components/home/HomeFanaticFeature";
import HomeRoomsRail from "../components/home/HomeRoomsRail";
import HomeLeaderboardPreview from "../components/home/HomeLeaderboardPreview";
import HomeStatsFeature from "../components/home/HomeStatsFeature";
import ShopSpotlight from "../components/home/ShopSpotlight";
import CTABanner from "../components/home/CTABanner";
import { useProfile } from "../hooks/useProfile";
import { useWarriorsNews } from "../hooks/useWarriorsNews";
import { useEventsFeed } from "../hooks/useEventsFeed";

const GAME_WINDOW_MS = 48 * 60 * 60 * 1000;

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: FireIcon,        label: "Fanatic",  desc: "Daily challenge",       to: "/fanatic"  },
    { icon: UserGroupIcon,   label: "Rooms",    desc: "Live watch parties",    to: "/rooms"    },
    { icon: AcademicCapIcon, label: "Quizzes",  desc: "Test your Warriors IQ", to: "/quizzes"  },
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
            <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-secondary/[0.07] text-secondary transition-colors group-hover:bg-primary/15">
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
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Real game detection — no mock data
  const { events, loading: eventsLoading } = useEventsFeed({
    limit: 10,
    types: ["game"],
    pollMs: 60_000,
  });

  const activeGame = eventsLoading ? null : (
    events.find((e) =>
      e.type === "game" && (
        e.meta.isLive === true ||
        (new Date(e.startAt).getTime() - Date.now() > 0 &&
         new Date(e.startAt).getTime() - Date.now() < GAME_WINDOW_MS)
      )
    ) ?? null
  );

  // News — always shown
  const { news, loading: newsLoading } = useWarriorsNews(1);
  const heroArticle = news[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <ScoreboardRibbon />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-16 md:pb-20">

        {/* 1. Game Card — real data, only if live or within 48h */}
        {!eventsLoading && activeGame && (
          <div className="fade-in-up stagger-1">
            <HomeGameCard event={activeGame} />
          </div>
        )}

        {/* 2. News Hero — always shown */}
        <div className={activeGame ? "mt-16 md:mt-20" : ""}>
          {newsLoading ? (
            <div className="rounded-3xl aspect-[4/5] md:aspect-[21/9] skeleton-shimmer" />
          ) : heroArticle ? (
            <div className="fade-in-up stagger-2">
              <HomeNewsHero article={heroArticle} />
            </div>
          ) : (
            <div className="rounded-3xl border border-container-border bg-white p-10 text-center">
              <p className="font-lato text-sm text-text-light">
                Press box is quiet right now. Check back at tip-off.
              </p>
            </div>
          )}
        </div>

        {/* Greeting — editorial only, not a hero */}
        {isLoggedIn && user && (
          <p className="mt-4 font-lato text-sm text-text-light">
            {timeOfDay},{" "}
            <span className="font-semibold text-secondary">@{user.username ?? "fan"}</span>.
          </p>
        )}

        {/* 3. Events Rail */}
        <div className="mt-16 md:mt-20">
          <EventsSlider />
        </div>

        {/* 4. Jump In */}
        <QuickActions />

        {/* 5. Fanatic */}
        <HomeFanaticFeature />

        {/* 6. Rooms */}
        <HomeRoomsRail />

        {/* 7. Leaderboard */}
        <HomeLeaderboardPreview />

        {/* 8. Stats */}
        <HomeStatsFeature />

        {/* 9. Warriors Shop */}
        <section className="mt-16 md:mt-20">
          <div className="flex items-baseline justify-between mb-4 md:mb-6">
            <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
              Warriors Shop
            </h2>
          </div>
          <ShopSpotlight />
        </section>

        {/* 10. CTA — logged-out users */}
        {!isLoggedIn && hasLoadedOnce && (
          <div className="mt-16 md:mt-20">
            <CTABanner />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
