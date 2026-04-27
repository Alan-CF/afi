import { useNavigate } from "react-router-dom";
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useRoomsPreview } from "../../hooks/useRoomsPreview";
import LiveBadge from "../common/LiveBadge";

export default function HomeRoomsRail() {
  const navigate = useNavigate();
  const { rooms, loading } = useRoomsPreview(5);

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <div>
          <h2 className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight">
            Watch Parties
          </h2>
          <p className="font-lato text-sm text-text-light mt-1">
            Join your crew or start a room.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/rooms")}
          className="font-lato text-sm font-bold text-secondary hover:text-primary transition-colors shrink-0"
        >
          See all →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-proximity scroll-pl-4 md:scroll-pl-6 lg:scroll-pl-8 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`snap-start shrink-0 w-[260px] h-[200px] rounded-2xl skeleton-shimmer fade-in-up stagger-${i + 1}`}
            />
          ))
        ) : (
          <>
            {rooms.map((room, i) => {
              const isLive = room.status === "live";
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(isLive ? `/rooms/${room.id}` : "/rooms")}
                  className={`group snap-start relative shrink-0 w-[260px] h-[200px] overflow-hidden rounded-2xl bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  aria-label={room.title}
                >
                  <svg
                    viewBox="0 0 260 200"
                    className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]"
                    aria-hidden
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <circle cx="200" cy="100" r="70" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <line x1="200" y1="20" x2="200" y2="180" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="140" y="20" width="120" height="80" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  <span
                    className="pointer-events-none absolute right-0 bottom-0 translate-x-[10%] translate-y-[10%] font-anton text-primary opacity-[0.08] select-none leading-none"
                    style={{ fontSize: "clamp(7rem, 18vw, 11rem)" }}
                    aria-hidden
                  >
                    W
                  </span>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3">
                    {isLive ? (
                      <LiveBadge />
                    ) : (
                      <span className="rounded-md bg-white/10 px-2 py-1 font-lato text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/70">
                        Offline
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-lato text-[0.6rem] font-bold uppercase tracking-[0.16em] text-primary mb-1">
                      Watch party
                    </p>
                    <h3 className="font-anton text-xl text-white leading-tight line-clamp-2">
                      {room.title}
                    </h3>
                    <p className="font-lato text-xs text-white/55 mt-1.5 line-clamp-1">
                      {room.members}
                    </p>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => navigate("/rooms/create")}
              className="group snap-start shrink-0 w-[260px] h-[200px] rounded-2xl border-2 border-dashed border-container-border bg-text-light-soft hover:border-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex flex-col items-center justify-center gap-3 lift-on-hover"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.08] text-secondary group-hover:bg-secondary/15 transition-colors">
                <PlusIcon className="h-6 w-6" />
              </span>
              <span className="font-lato text-sm font-bold text-text-light group-hover:text-secondary transition-colors">
                Create a room
              </span>
            </button>
          </>
        )}
      </div>

      {!loading && rooms.length === 0 && (
        <div className="mt-4 rounded-3xl border border-container-border bg-white p-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.08] text-secondary mb-4">
            <UserGroupIcon className="h-6 w-6" />
          </span>
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
