import { useEffect, useRef, useState } from "react";
import { fetchUpcomingEvents, type UnifiedEvent, type EventType } from "./events";

export interface UseEventsFeedOptions {
  limit?: number;
  types?: EventType[];
  /** Poll interval in ms. Default: 60_000 (1 min). */
  pollMs?: number;
}

export function useEventsFeed(options: UseEventsFeedOptions = {}) {
  const { limit = 4, types, pollMs = 60_000 } = options;
  const typesKey = types ? [...types].sort().join(",") : "all";

  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const data = await fetchUpcomingEvents({ limit, types, signal: controller.signal });
      if (!controller.signal.aborted) {
        setEvents(data);
        setError(null);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("useEventsFeed:", err);
        setError((err as Error).message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, pollMs);
    return () => {
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, typesKey, pollMs]);

  return { events, loading, error, refresh: load };
}
