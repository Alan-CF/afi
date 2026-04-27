import { useEffect, useState } from "react";
import { fetchMyRooms, type RoomCardData } from "./useRooms";

export function useRoomsPreview(limit = 3) {
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchMyRooms();
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          if (a.status === "live" && b.status !== "live") return -1;
          if (a.status !== "live" && b.status === "live") return 1;
          return a.title.localeCompare(b.title);
        });
        setRooms(sorted.slice(0, limit));
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [limit]);

  return { rooms, loading, error };
}
