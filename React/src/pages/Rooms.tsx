import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
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
      className={`w-full rounded-[1.5rem] p-4 shadow-[0_14px_34px_rgba(17,24,39,0.08)] ${
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
                  className={`font-lato text-base font-bold leading-5 sm:text-[1.05rem] ${
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
                className={`mt-1 font-lato text-xs sm:text-sm ${
                  isLive ? "text-[#566173]" : "text-[#8b94a3]"
                }`}
              >
                {room.members}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => {}}
              className={`w-full rounded-xl px-4 py-2 text-xs font-bold sm:w-auto ${
                isLive
                  ? "border-transparent bg-secondary text-white"
                  : "border-transparent bg-[#c8d0dc] text-white"
              }`}
            >
              Join Room
            </Button>
          </div>

          <p
            className={`mt-3 font-lato text-xs sm:text-sm ${
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
  const orderedRooms = [...rooms].sort((a, b) => {
    if (a.status === "live" && b.status !== "live") return -1;
    if (a.status !== "live" && b.status === "live") return 1;
    return 0;
  });

  const liveCount = orderedRooms.filter((room) => room.status === "live").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_45%,_#dce6f3_100%)]">
      <NavBar />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1720px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8 xl:px-10 2xl:px-14">
        <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-stretch">
          <div className="rounded-[2rem] bg-secondary px-5 py-6 text-white shadow-[0_20px_50px_rgba(29,66,138,0.28)] sm:px-7 sm:py-8 xl:min-h-[460px]">
            <p className="font-lato text-sm font-bold uppercase tracking-[0.24em] text-white/70">
              Fan Community
            </p>
            <h1 className="mt-3 font-lato text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Private Fan Rooms
            </h1>
            <p className="mt-3 max-w-sm font-lato text-sm leading-6 text-white/78 sm:text-base">
              Summary of all your chats, recent room activity, and the
              conversations waiting for you.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-lato text-xs uppercase tracking-[0.16em] text-white/70">
                  Active
                </p>
                <p className="mt-2 font-anton text-4xl text-primary">{liveCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-lato text-xs uppercase tracking-[0.16em] text-white/70">
                  Total
                </p>
                <p className="mt-2 font-anton text-4xl text-primary">{orderedRooms.length}</p>
              </div>
            </div>

            <div className="mt-6 hidden xl:block">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-lato text-xs uppercase tracking-[0.18em] text-white/65">
                      Create Room
                    </p>
                    <h2 className="mt-2 font-lato text-xl font-bold text-white">
                      Start a new watch party
                    </h2>
                    <p className="mt-2 max-w-xs font-lato text-sm leading-6 text-white/72">
                      Open a new private room for live reactions, predictions,
                      and game-day chat.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-secondary shadow-[0_12px_24px_rgba(255,199,44,0.28)]">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => {}}
                  className="mt-4 w-full rounded-xl border-transparent py-3 font-bold text-secondary"
                >
                  Create Room
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/88 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.12)] backdrop-blur-sm sm:p-6 xl:min-h-[460px] xl:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-lato text-sm font-bold text-[#1c2434]">
                  Your Rooms
                </p>
                <p className="mt-1 font-lato text-xs text-[#7d8797] sm:text-sm">
                  {orderedRooms.length} conversations in your list
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full bg-[#eef4ff] px-4 py-2 font-lato text-xs font-bold text-secondary sm:block">
                  Live watch parties
                </div>
                <Button
                  variant="primary"
                  onClick={() => {}}
                  className="hidden rounded-xl border-transparent px-4 py-2 text-xs font-bold text-secondary lg:block"
                >
                  Create Room
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {orderedRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}

              <div className="lg:col-span-2 2xl:col-span-1">
                <div className="flex h-full min-h-[210px] flex-col justify-between rounded-[1.75rem] border border-dashed border-[#bfd0ea] bg-[linear-gradient(145deg,_rgba(255,255,255,0.98),_rgba(230,238,251,0.94))] p-5 shadow-[0_16px_40px_rgba(37,99,235,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white">
                        <ChatBubbleLeftRightIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-lato text-sm font-bold text-[#21304b]">
                          Create a new room
                        </p>
                        <p className="mt-1 max-w-sm font-lato text-xs leading-5 text-[#738196] sm:text-sm">
                          Set up another private chat for predictions, live
                          reactions, or post-game conversation.
                        </p>
                      </div>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-secondary shadow-[0_12px_24px_rgba(255,199,44,0.32)]">
                      <PlusIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => {}}
                    className="mt-5 w-full rounded-xl border-transparent py-3 font-bold text-secondary"
                  >
                    Create Room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/80 p-5 shadow-[0_24px_70px_rgba(30,41,59,0.1)] backdrop-blur-sm sm:p-6 xl:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-secondary/65">
                Room Summary
              </p>
              <h2 className="mt-2 font-lato text-2xl font-bold tracking-[-0.03em] text-[#1f2d46] sm:text-3xl">
                Keep every game conversation organized in one place
              </h2>
              <p className="mt-3 font-lato text-sm leading-6 text-[#6f7d92] sm:text-base">
                Live rooms stay highlighted first, while previous chats remain
                visible below with a quieter style so the active conversations
                always stand out on laptop and mobile.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
              <div className="rounded-2xl bg-[#eef4ff] p-4">
                <p className="font-lato text-xs uppercase tracking-[0.16em] text-secondary/60">
                  Priority
                </p>
                <p className="mt-2 font-lato text-base font-bold text-secondary">
                  Live rooms first
                </p>
              </div>
              <div className="rounded-2xl bg-[#f5f7fb] p-4">
                <p className="font-lato text-xs uppercase tracking-[0.16em] text-[#7b8798]">
                  Status
                </p>
                <p className="mt-2 font-lato text-base font-bold text-[#405066]">
                  Inactive rooms dimmed
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff7df] p-4">
                <p className="font-lato text-xs uppercase tracking-[0.16em] text-[#a27a00]">
                  Action
                </p>
                <p className="mt-2 font-lato text-base font-bold text-[#6f5500]">
                  Create Room ready
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <button
        type="button"
        aria-label="Create room"
        className="fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_30px_rgba(255,199,44,0.45)] transition-transform hover:scale-105 sm:bottom-8 sm:right-8 xl:hidden"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}

export default Rooms;
