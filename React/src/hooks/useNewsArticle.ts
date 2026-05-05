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

function findArticle(news: WarriorsNewsItem[], param: string): WarriorsNewsItem | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(param);
    } catch {
      return param;
    }
  })();
  const bySlug = news.find((a) => a.slug && a.slug === param);
  if (bySlug) return bySlug;
  const byDecodedSlug = news.find((a) => a.slug && a.slug === decoded);
  if (byDecodedSlug) return byDecodedSlug;
  const byId = news.find((a) => a.id === param || a.id === decoded);
  if (byId) return byId;
  const byPrefix = news.find(
    (a) => param.startsWith(`${a.id}-`) || decoded.startsWith(`${a.id}-`),
  );
  if (byPrefix) return byPrefix;
  return null;
}

export function useNewsArticle(param: string | null) {
  const [article, setArticle] = useState<WarriorsNewsItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<WarriorsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!param) {
      setLoading(false);
      setError("missing slug");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const news = await fetchWarriorsNews(30, controller.signal);
        if (cancelled) return;

        const found = findArticle(news, param!);
        setArticle(found);
        setRelatedArticles(
          news
            .filter((a) => (found ? a.id !== found.id : a.id !== param && a.slug !== param))
            .slice(0, 3),
        );
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
  }, [param]);

  return {
    article,
    relatedArticles,
    related: relatedArticles,
    loading,
    error,
    notFound: !loading && !article,
  };
}
