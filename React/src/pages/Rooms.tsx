import { PlusIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import NavBar from "../components/layout/NavBar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

type Room = {
  id: number;
  title: string;
  status?: "live";
  members: string;
  subtitle: string;
  accent: string;
};

type RoomFilter = "all" | "live" | "offline";

const rooms: Room[] = [
  {
    id: 1,
    title: "Warriors Game Night",
    status: "live",
    members: "Cesar, Luis, Maria +2",
    subtitle: "Luis: That dunk was insane!",
    accent: "#1D428A",
  },
  {
    id: 2,
    title: "Lakers Watch Party",
    members: "Alex, Emma, Mike",
    subtitle: "Emma: Can't wait for tonight",
    accent: "#5B2D91",
  },
  {
    id: 3,
    title: "Playoffs Squad",
    status: "live",
    members: "David, Sophie, Tom +3",
    subtitle: "Tom: LeBron is on fire",
    accent: "#0E7490",
  },
];

function RoomCard({ room }: { room: Room }) {
  const isLive = room.status === "live";

  return (
    <Card
      className={`w-full rounded-[1.35rem] p-3.5 shadow-[0_14px_34px_rgba(17,24,39,0.08)] sm:p-4 xl:min-h-[180px] xl:rounded-[1.5rem] xl:p-5 ${
        isLive
          ? "border-2 border-secondary bg-white"
          : "border border-[#d7dce6] bg-[#f4f6fa]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          style={{ backgroundColor: isLive ? room.accent : "#98A2B3" }}
        >
          <UserGroupIcon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={`font-lato text-[0.98rem] font-bold leading-5 sm:text-[1.05rem] lg:text-[1.18rem] xl:text-[1.45rem] xl:leading-8 ${
                    isLive ? "text-[#22314d]" : "text-[#4b5565]"
                  }`}
                >
                  {room.title}
                </h2>
                {room.status === "live" && (
                  <span className="rounded-full bg-[#ff4d57] px-2 py-1 font-lato text-[0.55rem] font-bold uppercase tracking-[0.14em] text-white">
                    Live
                  </span>
                )}
              </div>
              <p
                className={`mt-1 font-lato text-[0.78rem] sm:text-sm lg:text-[0.98rem] xl:text-[1.08rem] ${
                  isLive ? "text-[#566173]" : "text-[#8b94a3]"
                }`}
              >
                {room.members}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => {}}
              className={`w-full rounded-xl px-4 py-2 text-xs font-bold sm:w-auto lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3 xl:text-base ${
                isLive
                  ? "border-transparent bg-secondary text-white"
                  : "border-transparent bg-[#c8d0dc] text-white"
              }`}
            >
              Join Room
            </Button>
          </div>

          <p
            className={`mt-3 font-lato text-[0.78rem] sm:text-sm lg:text-[0.98rem] xl:mt-4 xl:text-[1.05rem] ${
              isLive ? "text-[#8a95a7]" : "text-[#a4acb8]"
            }`}
          >
            {room.subtitle}
          </p>
        </div>
      </div>
    </Card>
  );
}

function Rooms() {
  const [filter, setFilter] = useState<RoomFilter>("all");

  const orderedRooms = [...rooms].sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    return 0;
  });

  const liveCount = orderedRooms.filter((room) => room.status === "live").length;
  const offlineCount = orderedRooms.length - liveCount;
  const filteredRooms = orderedRooms.filter((room) => {
    if (filter === "live") return room.status === "live";
    if (filter === "offline") return room.status !== "live";
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_45%,_#dce6f3_100%)]">
      <NavBar />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1880px] flex-col gap-5 px-3 py-3 sm:px-5 sm:py-6 xl:px-12 2xl:px-16">
        <header className="px-1 pt-1 sm:px-0">
          <h1 className="font-barlow-condensed text-[2rem] font-semibold tracking-[-0.02em] leading-[0.92] text-secondary sm:text-[2.35rem] lg:text-[3rem] xl:text-[3.7rem]">
            Private Fan Rooms
          </h1>
        </header>

        <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-stretch">
          <div className="rounded-[1.45rem] bg-secondary px-3.5 py-3.5 text-white shadow-[0_20px_50px_rgba(29,66,138,0.28)] sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:min-h-[460px] xl:rounded-[2rem]">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start xl:grid-cols-1 xl:gap-4">
              <div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:gap-4">
                  <div className="rounded-[1.15rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:rounded-2xl sm:p-4 lg:p-5">
                    <div className="flex items-center justify-between gap-2 sm:justify-between">
                      <p className="font-lato text-[0.62rem] uppercase tracking-[0.12em] text-white/70 sm:text-xs lg:text-sm">
                        Active:
                      </p>
                      <p className="font-anton text-[1.55rem] leading-none text-primary sm:text-[1.9rem] lg:text-[2.4rem] xl:text-[2.8rem]">
                        {liveCount}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:rounded-2xl sm:p-4 lg:p-5">
                    <div className="flex items-center justify-between gap-2 sm:justify-between">
                      <p className="font-lato text-[0.62rem] uppercase tracking-[0.12em] text-white/70 sm:text-xs lg:text-sm">
                        Total:
                      </p>
                      <p className="font-anton text-[1.55rem] leading-none text-primary sm:text-[1.9rem] lg:text-[2.4rem] xl:text-[2.8rem]">
                        {orderedRooms.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3 backdrop-blur-sm sm:rounded-[1.35rem] sm:p-4 lg:p-5 xl:mt-6 xl:rounded-[1.75rem] xl:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-lato text-[0.62rem] uppercase tracking-[0.18em] text-white/65 sm:text-xs lg:text-sm">
                      Create Room
                    </p>
                    <h2 className="mt-2 font-lato text-[1rem] font-bold text-white sm:text-[1.22rem] lg:text-[1.5rem] xl:text-[2rem]">
                      Start a new watch party
                    </h2>
                    <p className="mt-2 max-w-sm font-lato text-[0.76rem] leading-5 text-white/76 sm:text-[0.9rem] lg:text-[1rem] lg:leading-7 xl:max-w-sm xl:text-[1.08rem] xl:leading-8">
                      Open a new private room for live reactions, predictions, and
                      game-day chat.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary text-secondary shadow-[0_12px_24px_rgba(255,199,44,0.28)] sm:h-12 sm:w-12 sm:rounded-2xl lg:h-13 lg:w-13 xl:h-14 xl:w-14">
                    <PlusIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => {}}
                  className="mt-3 w-full rounded-xl border-transparent py-2 text-[0.9rem] font-bold text-secondary sm:mt-4 sm:py-3 sm:text-[0.95rem] lg:py-3.5 lg:text-base xl:py-4 xl:text-lg"
                >
                  Create Room
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] bg-white/88 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:p-5 xl:min-h-[460px] xl:rounded-[2rem] xl:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="font-lato text-[1.02rem] font-bold text-[#1c2434] sm:text-[1.08rem] lg:text-[1.28rem] xl:text-[1.55rem]">
                  Your Rooms
                </p>
                <p className="mt-1 font-lato text-[0.88rem] text-[#7d8797] sm:text-[0.95rem] lg:text-[1.05rem] xl:text-[1.15rem]">
                  {filteredRooms.length} of {orderedRooms.length} conversations visible
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden rounded-full bg-[#eef4ff] px-4 py-2 font-lato text-sm font-bold text-secondary lg:block xl:px-5 xl:py-2.5 xl:text-base">
                  Live watch parties
                </div>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-full px-4 py-2 font-lato text-[0.84rem] font-bold transition-colors sm:text-sm lg:px-5 lg:py-2.5 lg:text-base xl:text-[1.02rem] ${
                    filter === "all"
                      ? "bg-secondary text-white"
                      : "bg-[#f1f4f9] text-[#64748b]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("live")}
                  className={`rounded-full px-4 py-2 font-lato text-[0.84rem] font-bold transition-colors sm:text-sm lg:px-5 lg:py-2.5 lg:text-base xl:text-[1.02rem] ${
                    filter === "live"
                      ? "bg-[#ff4d57] text-white"
                      : "bg-[#fff1f2] text-[#ff4d57]"
                  }`}
                >
                  Live ({liveCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("offline")}
                  className={`rounded-full px-4 py-2 font-lato text-[0.84rem] font-bold transition-colors sm:text-sm lg:px-5 lg:py-2.5 lg:text-base xl:text-[1.02rem] ${
                    filter === "offline"
                      ? "bg-[#8893a5] text-white"
                      : "bg-[#f1f4f8] text-[#7b8798]"
                  }`}
                >
                  Offline ({offlineCount})
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            {filteredRooms.length === 0 && (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#c9d6e8] bg-[#f7faff] px-5 py-8 text-center">
                <p className="font-lato text-lg font-bold text-[#28406a] xl:text-xl">
                  No rooms in this filter
                </p>
                <p className="mt-2 font-lato text-base text-[#7b8798] xl:text-lg">
                  Switch between Live and Offline to preview the different chat states.
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

export default Rooms;
