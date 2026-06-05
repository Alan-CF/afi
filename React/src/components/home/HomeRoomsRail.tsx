import { Link, useNavigate } from 'react-router-dom';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/solid';
import { useRoomsPreview } from '../../hooks/useRoomsPreview';
import { useProfile } from '../../hooks/useProfile';
import LiveBadge from '../common/LiveBadge';

export default function HomeRoomsRail() {
  const navigate = useNavigate();
  const { user, hasLoadedOnce } = useProfile();
  const isLoggedIn = hasLoadedOnce && user !== null;
  const { rooms, loading } = useRoomsPreview(5);

  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <Link
          to="/rooms"
          className="font-anton text-xl md:text-2xl lg:text-3xl text-secondary leading-tight hover:text-[#5780AE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          Watch Parties
        </Link>
        <Link
          to="/rooms"
          className="font-lato text-sm font-bold text-secondary hover:text-[#5780AE] transition-colors shrink-0"
        >
          See all
        </Link>
      </div>

      {!isLoggedIn ? (
        <article className="relative overflow-hidden rounded-3xl bg-secondary p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 fade-in-up stagger-1">
          <svg
            viewBox="0 0 800 400"
            className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.04]"
            aria-hidden
            preserveAspectRatio="xMidYMid slice"
          >
            <rect
              x="20"
              y="20"
              width="760"
              height="360"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="400"
              cy="380"
              r="160"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[15%] font-anton text-primary opacity-[0.08] select-none leading-none"
            style={{ fontSize: 'clamp(7rem, 16vw, 14rem)' }}
            aria-hidden
          >
            W
          </span>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

          <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <UserGroupIcon className="h-6 w-6" />
          </span>
          <div className="relative z-10 flex-1 min-w-0">
            <h3 className="font-anton text-xl md:text-2xl text-white leading-tight">
              Join a live watch party
            </h3>
            <p className="font-lato text-sm text-white/65 mt-1.5">
              Follow live reactions, fan predictions, and watch-party
              conversations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="relative z-10 shrink-0 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Explore rooms
          </button>
        </article>
      ) : loading ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-proximity pr-4 md:pr-6 lg:pr-8 pb-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`snap-start shrink-0 w-[260px] h-[200px] rounded-2xl skeleton-shimmer fade-in-up stagger-${i + 1}`}
            />
          ))}
        </div>
      ) : rooms.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-proximity pr-4 md:pr-6 lg:pr-8 pb-1">
          {rooms.map((room, i) => {
            const isLive = room.status === 'live';
            return (
              <button
                key={room.id}
                type="button"
                onClick={() =>
                  navigate(isLive ? `/rooms/${room.id}` : '/rooms')
                }
                className={`group snap-start relative shrink-0 w-[260px] h-[200px] overflow-hidden rounded-2xl bg-secondary text-left lift-on-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary fade-in-up stagger-${Math.min(i + 1, 6)}`}
                aria-label={room.title}
              >
                <svg
                  viewBox="0 0 260 200"
                  className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]"
                  aria-hidden
                  preserveAspectRatio="xMidYMid slice"
                >
                  <circle
                    cx="200"
                    cy="100"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <line
                    x1="200"
                    y1="20"
                    x2="200"
                    y2="180"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="140"
                    y="20"
                    width="120"
                    height="80"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
                <span
                  className="pointer-events-none absolute right-0 bottom-0 translate-x-[10%] translate-y-[10%] font-anton text-primary opacity-[0.08] select-none leading-none"
                  style={{ fontSize: 'clamp(7rem, 18vw, 11rem)' }}
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
            onClick={() => navigate('/rooms/create')}
            className="group snap-start shrink-0 w-[260px] h-[200px] rounded-2xl border-2 border-dashed border-container-border bg-text-light-soft hover:border-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex flex-col items-center justify-center gap-3 lift-on-hover"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/[0.08] text-secondary group-hover:bg-secondary/15 transition-colors">
              <PlusIcon className="h-6 w-6" />
            </span>
            <span className="font-lato text-sm font-bold text-text-light group-hover:text-secondary transition-colors">
              Create a room
            </span>
          </button>
        </div>
      ) : (
        <article className="relative overflow-hidden rounded-3xl bg-secondary p-6 sm:p-8 md:p-10 flex flex-col items-start gap-4 fade-in-up stagger-1">
          <svg
            viewBox="0 0 800 400"
            className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.04]"
            aria-hidden
            preserveAspectRatio="xMidYMid slice"
          >
            <rect
              x="20"
              y="20"
              width="760"
              height="360"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 160 20 Q 160 200, 400 200 Q 640 200, 640 20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="400"
              cy="380"
              r="160"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[15%] font-anton text-primary opacity-[0.08] select-none leading-none"
            style={{ fontSize: 'clamp(7rem, 16vw, 14rem)' }}
            aria-hidden
          >
            W
          </span>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

          <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <UserGroupIcon className="h-6 w-6" />
          </span>
          <div className="relative z-10 max-w-md">
            <h3 className="font-anton text-xl md:text-2xl text-white leading-tight">
              No watch parties yet
            </h3>
            <p className="font-lato text-sm text-white/65 mt-1.5">
              Start a room and invite your crew to react live during the game.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/rooms/create')}
            className="relative z-10 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PlusIcon className="h-4 w-4" />
            Create a room
          </button>
        </article>
      )}
    </section>
  );
}
