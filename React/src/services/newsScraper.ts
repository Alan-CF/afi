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

interface EdgeArticleResponse {
  title: string | null;
  author: string | null;
  source: string | null;
  publishedAt: string | null;
  image: string | null;
  body: string | null;
  originalUrl: string;
  error?: string;
}

function resolveEndpoint(): string | null {
  const override = (import.meta.env.VITE_NEWS_SCRAPER_URL as string | undefined)?.trim();
  if (override) return override.replace(/\/+$/, "");
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/news-article`;
}

async function fetchEnriched(
  url: string,
  signal?: AbortSignal,
): Promise<EdgeArticleResponse | null> {
  const endpoint = resolveEndpoint();
  if (!endpoint) return null;

  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (anonKey) {
    headers["apikey"] = anonKey;
    headers["Authorization"] = `Bearer ${anonKey}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as EdgeArticleResponse;
    if (data.error) return null;
    return data;
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      console.warn("news-article enrichment failed:", err);
    }
    return null;
  }
}

export async function fetchScrapedArticle(
  id: string,
  fallback?: WarriorsNewsItem,
  signal?: AbortSignal,
): Promise<ScrapedArticle> {
  const targetUrl = fallback?.originalUrl ?? fallback?.link ?? null;
  const enriched = targetUrl ? await fetchEnriched(targetUrl, signal) : null;

  if (!fallback) {
    if (enriched) {
      return {
        id,
        title: enriched.title ?? "",
        link: enriched.originalUrl,
        publishedAt: enriched.publishedAt ?? new Date().toISOString(),
        thumbnail: enriched.image,
        description: "",
        body: enriched.body,
        author: enriched.author,
        source: enriched.source,
      };
    }
    throw new Error("Article not found and scraper unavailable");
  }

  return {
    id: fallback.id,
    title: enriched?.title ?? fallback.title,
    link: fallback.link,
    publishedAt: enriched?.publishedAt ?? fallback.publishedAt,
    thumbnail: enriched?.image ?? fallback.thumbnail,
    description: fallback.description,
    body: enriched?.body ?? null,
    author: enriched?.author ?? fallback.author ?? null,
    source: enriched?.source ?? fallback.sourceName ?? "ESPN",
  };
}
