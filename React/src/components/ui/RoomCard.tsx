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
};

type RoomCardProps = {
  room: Room;
  onActionClick?: (room: Room) => void;
};

function RoomCard({ room, onActionClick }: RoomCardProps) {
  const isLive = room.status === "live";
  const actionLabel = isLive ? "Join Room" : "See Summary";

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

export default RoomCard;
