import { useEffect, useState } from "react";
import { fetchWarriorsNews, type WarriorsNewsItem } from "./warriorsNews";

export function articleSlug(id: string): string {
  return encodeURIComponent(id);
}

export function articleSlugDecode(slug: string | undefined): string | null {
  if (!slug) return null;
  try {
    return decodeURIComponent(slug);
  } catch {
    return null;
  }
}

export function useNewsArticle(id: string | null) {
  const [article, setArticle] = useState<WarriorsNewsItem | null>(null);
  const [related, setRelated] = useState<WarriorsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("missing id");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const news = await fetchWarriorsNews(30, controller.signal);
        if (cancelled) return;

        const found = news.find((a) => a.id === id) ?? null;
        setArticle(found);
        setRelated(news.filter((a) => a.id !== id).slice(0, 4));
        setError(found ? null : "not found");
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  return { article, related, loading, error };
}
