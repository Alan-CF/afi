const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

export interface WarriorsNewsItem {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
  description: string;
}

interface EspnArticle {
  id?: string;
  headline: string;
  links?: { web?: { href?: string } };
  published?: string;
  images?: Array<{ url?: string }>;
  description?: string;
}

export async function fetchWarriorsNews(limit = 6, signal?: AbortSignal): Promise<WarriorsNewsItem[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/news?team=9&limit=${limit}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const articles: EspnArticle[] = data.articles ?? [];
    return articles.slice(0, limit).map((a) => ({
      id: a.id ?? a.headline,
      title: a.headline,
      link: a.links?.web?.href ?? "https://www.nba.com/warriors/news",
      publishedAt: a.published ? new Date(a.published).toISOString() : new Date().toISOString(),
      thumbnail: a.images?.[0]?.url ?? null,
      description: a.description ?? "",
    }));
  } catch (err) {
    if ((err as Error).name !== "AbortError") console.warn("fetchWarriorsNews:", err);
    return [];
  }
}
