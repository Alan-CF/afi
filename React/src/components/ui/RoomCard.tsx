import { UserGroupIcon } from "@heroicons/react/24/solid";
import Button from "./Button";
import Card from "./Card";

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
  const actionLabel = isLive ? "Join Room" : "See Summary";
  const subtitlePreview = splitSubtitlePreview(room.subtitle);

  return (
    <Card
      className={`w-full rounded-[1.35rem] p-3.5 shadow-[0_14px_34px_rgba(17,24,39,0.08)] sm:p-4 xl:min-h-[180px] xl:rounded-[1.5rem] xl:p-5 ${
        isLive
          ? "border-2 border-secondary bg-white"
          : "border border-[#d7dce6] bg-[#f4f6fa]"
      }`}
    >
      <div className="flex h-full items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          style={{ backgroundColor: isLive ? room.accent : "#98A2B3" }}
        >
          <UserGroupIcon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex flex-1 flex-col self-stretch">
          <div className="flex min-h-[5.5rem] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:min-h-[6.25rem]">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={`font-lato text-[0.98rem] font-bold leading-5 [overflow-wrap:anywhere] sm:text-[1.05rem] lg:text-[1.18rem] xl:text-[1.45rem] xl:leading-8 ${
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
                className={`mt-1 min-h-[2.5rem] font-lato text-[0.78rem] leading-5 [overflow-wrap:anywhere] sm:text-sm lg:min-h-[3rem] lg:text-[0.98rem] lg:leading-6 xl:text-[1.08rem] ${
                  isLive ? "text-[#566173]" : "text-[#8b94a3]"
                }`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {room.members}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => onActionClick?.(room)}
              className={`w-full rounded-xl px-4 py-2 text-xs font-bold sm:w-auto lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3 xl:text-base ${
                isLive
                  ? "border-transparent bg-secondary text-white"
                  : "border-transparent bg-[#c8d0dc] text-white"
              }`}
            >
              {actionLabel}
            </Button>
          </div>

          <p
            className={`mt-2.5 font-lato text-[0.78rem] leading-5 [overflow-wrap:anywhere] sm:text-sm lg:mt-3 lg:text-[0.98rem] lg:leading-6 xl:text-[1.05rem] ${
              isLive ? "text-[#8a95a7]" : "text-[#a4acb8]"
            }`}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitlePreview.sender ? (
              <>
                <span
                  className={`font-bold ${
                    isLive ? "text-[#5f7190]" : "text-[#7f8b9d]"
                  }`}
                >
                  {subtitlePreview.sender}:
                </span>{" "}
                <span>{subtitlePreview.message}</span>
              </>
            ) : (
              room.subtitle
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default RoomCard;
