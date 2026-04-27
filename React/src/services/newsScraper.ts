import type { WarriorsNewsItem } from "../hooks/warriorsNews";

export interface ScrapedArticle {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
  description: string;
  body?: string | null;
  author?: string | null;
  source?: string | null;
}

const BACKEND_URL = (import.meta.env.VITE_NEWS_SCRAPER_URL as string | undefined) ?? null;

export async function fetchScrapedArticle(
  id: string,
  fallback?: WarriorsNewsItem,
  signal?: AbortSignal
): Promise<ScrapedArticle> {
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}?id=${encodeURIComponent(id)}`, { signal });
      if (res.ok) {
        const data = (await res.json()) as ScrapedArticle;
        return data;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.warn("scraper fetch failed:", err);
      }
    }
  }

  if (!fallback) {
    throw new Error("Article not found and scraper unavailable");
  }

  return {
    id: fallback.id,
    title: fallback.title,
    link: fallback.link,
    publishedAt: fallback.publishedAt,
    thumbnail: fallback.thumbnail,
    description: fallback.description,
    body: null,
    author: null,
    source: "ESPN",
  };
}
