import { useEffect, useRef, useState } from "react";
import { fetchWarriorsNews, type WarriorsNewsItem } from "./warriorsNews";

export function useWarriorsNews(limit = 6, pollMs = 10 * 60_000) {
  const [news, setNews] = useState<WarriorsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const data = await fetchWarriorsNews(limit, controller.signal);
      if (!controller.signal.aborted) { setNews(data); setError(null); }
    } catch (err) {
      if (!controller.signal.aborted) setError((err as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, pollMs);
    return () => { window.clearInterval(interval); abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, pollMs]);

  return { news, loading, error, refresh: load };
}
