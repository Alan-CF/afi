import FramedAvatar from '../ui/FramedAvatar';

export interface LineupUser {
  profile_id: string;
  rank: number;
  username: string;
  points: number;
  avatar_url: string | null;
  frameId: string | null;
}

interface CourtPosition {
  abbr: string;
  name: string;
  top: string;
  left: string;
}

const POSITIONS: CourtPosition[] = [
  { abbr: 'PG', name: 'Point Guard', top: '22%', left: '50%' },
  { abbr: 'SG', name: 'Shooting Guard', top: '38%', left: '82%' },
  { abbr: 'SF', name: 'Small Forward', top: '38%', left: '18%' },
  { abbr: 'PF', name: 'Power Forward', top: '74%', left: '28%' },
  { abbr: 'C', name: 'Center', top: '74%', left: '72%' },
];

const COURT_GRADIENT =
  'linear-gradient(155deg, #efd9a4 0%, #e0bd79 52%, #d2a85f 100%)';

function CourtLines() {
  return (
    <svg
      viewBox="0 0 560 480"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full text-white"
      aria-hidden
    >
      <rect
        x="16"
        y="12"
        width="528"
        height="456"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <path
        d="M 222 12 A 58 58 0 0 0 338 12"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="3"
      />
      <path
        d="M 86 468 L 86 330 Q 86 150 280 150 Q 474 150 474 330 L 474 468"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="3"
      />
      <rect
        x="214"
        y="272"
        width="132"
        height="196"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <circle
        cx="280"
        cy="272"
        r="60"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="3"
      />
      <line
        x1="244"
        y1="438"
        x2="316"
        y2="438"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="4"
      />
      <circle
        cx="280"
        cy="450"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="3"
      />
    </svg>
  );
}

function CourtPlayerBadge({
  user,
  position,
  isMe,
}: {
  user: LineupUser;
  position: CourtPosition;
  isMe: boolean;
}) {
  return (
    <div
      className="absolute z-10 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.82] sm:scale-95 lg:scale-100"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          <FramedAvatar
            avatarUrl={user.avatar_url}
            frameId={user.frameId}
            size={76}
            ringClassName={
              isMe ? 'ring-[3px] ring-primary' : 'ring-2 ring-white/80'
            }
          />
          <span
            title={position.name}
            className="absolute -left-2.5 -top-2.5 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-secondary px-1.5 font-anton text-[0.8rem] leading-none text-white shadow-md"
          >
            {position.abbr}
          </span>
          <span className="absolute -bottom-2 -right-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1 font-anton text-[0.72rem] leading-none text-secondary shadow-md">
            {user.rank}
          </span>
        </div>
        <div className="max-w-[128px] rounded-lg bg-secondary/95 px-2.5 py-1 text-center shadow-md">
          <p className="truncate font-lato text-[0.8rem] font-bold leading-tight text-white">
            @{user.username}
          </p>
          <p className="font-anton text-[0.82rem] leading-none text-primary tabular-nums">
            {user.points.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StartingLineup({
  users,
  currentUserId,
}: {
  users: LineupUser[];
  currentUserId?: string | null;
}) {
  const five = users.slice(0, 5);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-container-border bg-white p-6 md:p-8">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h2 className="font-anton text-2xl md:text-3xl text-secondary leading-tight">
          Starting Lineup
        </h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 font-lato text-[0.62rem] font-bold uppercase tracking-[0.16em] text-secondary">
          Top 5
        </span>
      </div>
      <p className="mb-5 font-lato text-sm text-text-light">
        Top 5 fans of the season
      </p>

      {five.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-container-border bg-text-light-soft py-14 text-center">
          <p className="font-lato text-sm text-text-light">
            The lineup fills up after the first challenge.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-[360px] sm:min-h-[440px] lg:min-h-0">
          <div className="relative mx-auto h-full w-full max-w-[560px]">
            <div
              className="relative h-full w-full overflow-hidden rounded-3xl shadow-[inset_0_2px_18px_rgba(15,23,42,0.12)] ring-1 ring-secondary/10"
              style={{ background: COURT_GRADIENT }}
            >
              <CourtLines />
              {five.map((user, index) => (
                <CourtPlayerBadge
                  key={user.profile_id}
                  user={user}
                  position={POSITIONS[index]}
                  isMe={user.profile_id === currentUserId}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
