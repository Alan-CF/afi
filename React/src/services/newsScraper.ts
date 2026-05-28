import type { WarriorsNewsItem } from "../hooks/warriorsNews";

const REQUEST_TIMEOUT_MS = 90_000;

export interface ScrapedArticle {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
  description: string;
  body?: string | null;
  bodyParagraphs?: string[];
  author?: string | null;
  source?: string | null;
  provider?: "cache" | "apify" | null;
}

interface EdgeArticleResponse {
  title?: string | null;
  author?: string | null;
  source?: string | null;
  publishedAt?: string | null;
  image?: string | null;
  body?: string | null;
  bodyParagraphs?: string[] | null;
  originalUrl?: string;
  provider?: "cache" | "apify" | null;
  error?: string | null;
}

function resolveEndpoint(): string | null {
  const override = (import.meta.env.VITE_NEWS_SCRAPER_URL as string | undefined)?.trim();
  if (override) return override.replace(/\/+$/, "");
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/news-article`;
}

function normalizeTitle(title: string | null | undefined): string {
  return (title ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function normalizeParagraphs(
  paragraphs: string[] | null | undefined,
  body: string | null | undefined,
  articleTitle?: string | null,
): string[] {
  const titleKey = normalizeTitle(articleTitle);

  let candidates: string[] = [];
  if (Array.isArray(paragraphs) && paragraphs.length > 0) {
    candidates = paragraphs.map((p) => String(p).trim()).filter(Boolean);
  } else if (typeof body === "string" && body.trim().length > 0) {
    candidates = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (candidates.length <= 1) {
      candidates = body
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of candidates) {
    const p = raw.trim();
    if (!p) continue;
    const key = normalizeTitle(p);
    if (titleKey && key === titleKey) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

async function fetchEnriched(
  article: WarriorsNewsItem,
  signal?: AbortSignal,
): Promise<EdgeArticleResponse | null> {
  const endpoint = resolveEndpoint();
  if (!endpoint) return null;

  const targetUrl = article.originalUrl ?? article.link;
  if (!targetUrl) return null;

  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (anonKey) {
    headers["apikey"] = anonKey;
    headers["Authorization"] = `Bearer ${anonKey}`;
  }

  const body = {
    url: targetUrl,
    title: article.title,
    description: article.description,
    image: article.image ?? article.thumbnail ?? null,
    publishedAt: article.publishedAt,
    source: article.source ?? article.sourceName ?? "ESPN",
  };

  const localCtrl = new AbortController();
  const timeoutId = setTimeout(() => localCtrl.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => localCtrl.abort();
  if (signal) {
    if (signal.aborted) localCtrl.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: localCtrl.signal,
    });
    let data: EdgeArticleResponse | null = null;
    try {
      data = (await res.json()) as EdgeArticleResponse;
    } catch {
      data = null;
    }
    if (!res.ok) {
      if (data && (data.body || data.bodyParagraphs)) return data;
      return null;
    }
    return data ?? null;
  } catch (err) {
    const name = (err as Error)?.name;
    if (name !== "AbortError") {
      console.warn("news-article enrichment failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onExternalAbort);
  }
}

export async function fetchScrapedArticle(
  id: string,
  fallback?: WarriorsNewsItem,
  signal?: AbortSignal,
): Promise<ScrapedArticle> {
  const enriched = fallback ? await fetchEnriched(fallback, signal) : null;
  const usable = enriched && !enriched.error;

  const enrichedBody = usable ? (enriched?.body ?? null) : null;
  const enrichedParagraphs = usable
    ? normalizeParagraphs(
        enriched?.bodyParagraphs ?? null,
        enrichedBody,
        fallback?.title ?? enriched?.title ?? null,
      )
    : [];

  if (!fallback) {
    if (enriched) {
      return {
        id,
        title: enriched.title ?? "",
        link: enriched.originalUrl ?? "",
        publishedAt: enriched.publishedAt ?? new Date().toISOString(),
        thumbnail: enriched.image ?? null,
        description: "",
        body: enrichedBody,
        bodyParagraphs: enrichedParagraphs,
        author: enriched.author ?? null,
        source: enriched.source ?? null,
        provider: enriched.provider ?? null,
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
    body: enrichedBody,
    bodyParagraphs: enrichedParagraphs,
    author: enriched?.author ?? fallback.author ?? null,
    source: enriched?.source ?? fallback.sourceName ?? "ESPN",
    provider: enriched?.provider ?? null,
  };
}
