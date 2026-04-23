import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import GreetingStrip from "../components/home/GreetingStrip";
import EventsSlider from "../components/home/EventsSlider";
import QuickActions from "../components/home/QuickActions";
import FanaticTodayCard from "../components/home/FanaticTodayCard";
import QuizOfTheWeekCard from "../components/home/QuizOfTheWeekCard";
import LeaderboardPreview from "../components/home/LeaderboardPreview";
import RoomsPreview from "../components/home/RoomsPreview";
import ShopSpotlight from "../components/home/ShopSpotlight";

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-4 md:px-6 lg:px-8">

        {/* Greeting */}
        <GreetingStrip />

        {/* Events slider */}
        <div className="mt-6">
          <EventsSlider />
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <QuickActions />
        </div>

        {/* Fanatic + Quiz */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <FanaticTodayCard />
          </div>
          <div className="lg:col-span-5">
            <QuizOfTheWeekCard />
          </div>
        </div>

        {/* Leaderboard + Rooms */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LeaderboardPreview />
          <RoomsPreview />
        </div>

        {/* Shop */}
        <div className="mt-10">
          <ShopSpotlight />
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default Home;
