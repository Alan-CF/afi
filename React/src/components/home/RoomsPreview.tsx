import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import RoomCard from "../ui/RoomCard";
import { useRoomsPreview } from "../../hooks/useRoomsPreview";

export default function RoomsPreview() {
  const navigate = useNavigate();
  const { rooms, loading, error } = useRoomsPreview(3);

  return (
    <section
      aria-labelledby="rooms-title"
      className="flex h-full flex-col gap-3 rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm"
    >
      <header>
        <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">Community</p>
        <h2 id="rooms-title" className="font-anton text-2xl text-secondary">Your Rooms</h2>
      </header>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="font-lato text-sm text-destructive">Could not load rooms.</p>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
          <p className="font-lato text-sm text-text-light">You haven't joined any rooms yet.</p>
          <Button variant="primary" onClick={() => navigate("/rooms/create")}>
            Create a Room
          </Button>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard
                room={room}
                onActionClick={(r) =>
                  navigate(r.status === "live" ? `/rooms/${r.id}` : "/rooms")
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex gap-2 pt-3">
        <Button variant="secondary" className="flex-1" onClick={() => navigate("/rooms")}>
          All rooms
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => navigate("/rooms/create")}>
          + New
        </Button>
      </div>
    </section>
  );
}
