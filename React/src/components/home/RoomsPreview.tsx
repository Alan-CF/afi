import { useNavigate } from "react-router-dom";
import Rail from "./Rail";
import { useRoomsPreview } from "../../hooks/useRoomsPreview";
import type { RoomCardData } from "../../hooks/useRooms";

function RoomRailCard({ room, onClick }: { room: RoomCardData; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0 w-[280px] h-[200px] overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={room.title}
    >
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundColor: room.accent ?? "#1D428A" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {room.status === "live" && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-destructive px-2 py-1 font-lato text-[0.6rem] font-black uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          live
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-anton text-2xl text-white leading-tight line-clamp-1">{room.title}</h3>
        <p className="font-lato text-xs uppercase tracking-wider text-white/50 mt-1">{room.members}</p>
      </div>
    </button>
  );
}

function CreateRoomCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group shrink-0 w-[280px] h-[200px] overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 hover:border-secondary transition-colors focus:outline-none flex items-center justify-center"
      aria-label="Create a room"
    >
      <span className="font-anton text-2xl text-text-light group-hover:text-secondary transition-colors">
        Create a Room →
      </span>
    </button>
  );
}

export default function RoomsPreview() {
  const navigate = useNavigate();
  const { rooms, loading } = useRoomsPreview(4);

  return (
    <Rail title="Your Rooms" seeAllTo="/rooms">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[280px] h-[200px] animate-pulse rounded-2xl bg-gray-200" />
          ))
        : [
            ...rooms.map((room) => (
              <div key={room.id} className="snap-start shrink-0">
                <RoomRailCard
                  room={room}
                  onClick={() => navigate(room.status === "live" ? `/rooms/${room.id}` : "/rooms")}
                />
              </div>
            )),
            <div key="create" className="snap-start shrink-0">
              <CreateRoomCard onClick={() => navigate("/rooms/create")} />
            </div>,
          ]}
    </Rail>
  );
}
