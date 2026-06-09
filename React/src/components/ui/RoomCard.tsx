import { ChevronRightIcon, UserGroupIcon } from "@heroicons/react/24/solid";

export type Room = {
  id: number;
  title: string;
  status: "live" | "offline";
  members: string;
  subtitle: string;
  accent: string;
  memberProfileIds: string[];
  lastMessageAt?: string | null;
  lastMessageFromMe?: boolean;
  matchHidden?: boolean;
  imageUrl?: string | null;
  createdAt?: string | null;
  ownerProfileId?: string;
};

// A room is flagged "NEW" for this long after creation.
export const ROOM_NEW_WINDOW_MS = 5 * 60 * 1000;

export function isRoomNew(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < ROOM_NEW_WINDOW_MS;
}

type RoomCardProps = {
  room: Room;
  onActionClick?: (room: Room) => void;
  hasUnread?: boolean;
};

function formatLastMessageTime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const diffDays = (now.getTime() - date.getTime()) / 86_400_000;
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

function RoomCard({ room, onActionClick, hasUnread = false }: RoomCardProps) {
  const isLive = room.status === "live";
  const showLive = isLive && !room.matchHidden;
  const actionLabel = isLive ? "Join" : "Summary";
  const subtitlePreview = splitSubtitlePreview(room.subtitle);
  const lastMessageTime = formatLastMessageTime(room.lastMessageAt);
  const showNew = isRoomNew(room.createdAt);

  return (
    <button
      type="button"
      onClick={() => onActionClick?.(room)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition lift-on-hover sm:gap-4 sm:px-4 ${
        showNew
          ? "border-secondary bg-white ring-2 ring-secondary/40"
          : isLive
            ? "border-secondary/15 bg-white hover:border-secondary/35"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      {/* Left accent rail */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          isLive ? "bg-secondary" : "bg-slate-300"
        }`}
        aria-hidden
      />

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-white sm:h-12 sm:w-12"
          style={{
            backgroundColor: room.imageUrl
              ? undefined
              : isLive
                ? room.accent
                : "#94A3B8",
          }}
        >
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </div>
        {hasUnread && (
          <span
            className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-white"
            aria-label="Unread messages"
          />
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
          {showNew && (
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
              New
            </span>
          )}
          {showLive && (
            <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
              Live
            </span>
          )}
          {lastMessageTime && (
            <span className="ml-auto shrink-0 font-lato text-[0.68rem] font-medium text-slate-400">
              {lastMessageTime}
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
