import { useNavigate } from "react-router-dom";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { useRoomsPreview } from "../../hooks/useRoomsPreview";
import LiveBadge from "../common/LiveBadge";

export default function HomeRoomsRail() {
  const navigate = useNavigate();
  const { rooms, loading } = useRoomsPreview(5);

  return (
    <section className="mt-16 md:mt-20">
      <div className="flex items-baseline justify-between mb-4 md:mb-6">
        <h2 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
          Your Rooms
        </h2>
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
        >
          See all →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`snap-start shrink-0 w-[260px] h-[180px] rounded-2xl skeleton-shimmer fade-in-up stagger-${i + 1}`}
              />
            ))
          : [
              ...rooms.map((room, i) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(room.status === "live" ? `/rooms/${room.id}` : "/rooms")}
                  className={`group snap-start relative shrink-0 w-[260px] h-[180px] overflow-hidden rounded-2xl text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  aria-label={room.title}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ backgroundColor: room.accent ?? "var(--color-secondary)" }}
                  />
                  {/* Subtle court line overlay — no hex */}
                  <svg
                    viewBox="0 0 260 180"
                    className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]"
                    aria-hidden
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <circle cx="200" cy="90" r="70" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <line x1="200" y1="20" x2="200" y2="160" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                  {room.status === "live" && (
                    <div className="absolute top-3 right-3">
                      <LiveBadge />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-lato text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/45 mb-1">
                      Watch party
                    </p>
                    <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">
                      {room.title}
                    </h3>
                    <p className="font-lato text-xs text-white/45 mt-1 tabular-nums">
                      {room.members}
                    </p>
                  </div>
                </button>
              )),
              <button
                key="create"
                type="button"
                onClick={() => navigate("/rooms/create")}
                className="group snap-start shrink-0 w-[260px] h-[180px] rounded-2xl border-2 border-dashed border-container-border hover:border-secondary transition-colors focus:outline-none flex flex-col items-center justify-center gap-3 lift-on-hover"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.07] text-secondary group-hover:bg-secondary/12 transition-colors">
                  <UserGroupIcon className="h-6 w-6" />
                </span>
                <span className="font-lato text-sm font-bold text-text-light group-hover:text-secondary transition-colors">
                  Create a room
                </span>
              </button>,
            ]}
      </div>

      {!loading && rooms.length === 0 && (
        <div className="mt-4 rounded-3xl border border-container-border bg-white p-10 text-center">
          <p className="font-lato text-sm text-text-light">
            No rooms yet. Start a watch party with your crew.
          </p>
          <button
            type="button"
            onClick={() => navigate("/rooms/create")}
            className="mt-4 font-lato text-sm font-bold text-secondary hover:text-primary transition-colors"
          >
            Create the first room →
          </button>
        </div>
      )}
    </section>
  );
}
