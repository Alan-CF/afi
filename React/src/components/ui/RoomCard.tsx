import { ChevronRightIcon, UserGroupIcon } from "@heroicons/react/24/solid";

export type Room = {
  id: number;
  title: string;
  status: "live" | "offline";
  members: string;
  subtitle: string;
  accent: string;
  memberProfileIds: string[];
};

type RoomCardProps = {
  room: Room;
  onActionClick?: (room: Room) => void;
};

function splitSubtitlePreview(subtitle: string) {
  const separatorIndex = subtitle.indexOf(": ");

  if (separatorIndex === -1) {
    return {
      sender: null,
      message: subtitle,
    };
  }

  return {
    sender: subtitle.slice(0, separatorIndex),
    message: subtitle.slice(separatorIndex + 2),
  };
}

function RoomCard({ room, onActionClick }: RoomCardProps) {
  const isLive = room.status === "live";
  const actionLabel = isLive ? "Join" : "Summary";
  const subtitlePreview = splitSubtitlePreview(room.subtitle);

  return (
    <button
      type="button"
      onClick={() => onActionClick?.(room)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition lift-on-hover sm:gap-4 sm:px-4 ${
        isLive
          ? "border-secondary/15 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)] hover:border-secondary/35"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      {/* Left accent rail */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          isLive ? "bg-live" : "bg-slate-300"
        }`}
        aria-hidden
      />

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white sm:h-12 sm:w-12"
          style={{ backgroundColor: isLive ? room.accent : "#94A3B8" }}
        >
          <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        {isLive && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute h-3.5 w-3.5 rounded-full bg-live animate-pulse-live" />
            <span className="h-2 w-2 rounded-full bg-live ring-2 ring-white" />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={`truncate font-lato text-[0.95rem] font-bold sm:text-base ${
              isLive ? "text-[#16213d]" : "text-slate-600"
            }`}
          >
            {room.title}
          </h3>
          {isLive && (
            <span className="shrink-0 rounded-md bg-live/10 px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-live">
              Live
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate font-lato text-xs text-slate-400">
          {room.members}
        </p>

        <p className="mt-1 truncate font-lato text-[0.8rem] leading-5 text-slate-500 sm:text-sm">
          {subtitlePreview.sender ? (
            <>
              <span className="font-semibold text-slate-600">
                {subtitlePreview.sender}:
              </span>{" "}
              {subtitlePreview.message}
            </>
          ) : (
            <span className="italic text-slate-400">{room.subtitle}</span>
          )}
        </p>
      </div>

      {/* CTA */}
      <div
        className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 font-lato text-xs font-bold transition sm:px-3 ${
          isLive
            ? "bg-secondary text-white group-hover:bg-[#16327a]"
            : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
        }`}
      >
        <span className="hidden sm:inline">{actionLabel}</span>
        <ChevronRightIcon className="h-4 w-4" />
      </div>
    </button>
  );
}

export default RoomCard;
