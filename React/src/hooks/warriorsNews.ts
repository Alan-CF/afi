const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

export interface WarriorsNewsItem {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
  description: string;
  slug?: string;
  image?: string | null;
  originalUrl?: string;
  author?: string;
  source?: string;
  sourceName?: string;
  provider?: string;
  updatedAt?: string;
  category?: string;
  body?: string;
}

interface EspnImage {
  url?: string;
  width?: number;
  height?: number;
  type?: string;
}

interface EspnCategory {
  type?: string;
  description?: string;
}

interface EspnArticle {
  id?: string | number;
  headline: string;
  description?: string;
  published?: string;
  lastModified?: string;
  byline?: string;
  source?: string;
  links?: {
    web?: { href?: string };
    mobile?: { href?: string };
  };
  images?: EspnImage[];
  categories?: EspnCategory[];
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

export function createArticleSlug(
  id: string | number | null | undefined,
  title?: string | null,
): string {
  const safeId = id !== undefined && id !== null && String(id).length > 0 ? String(id) : "";
  const safeTitle = title ? slugifyTitle(title) : "";
  if (!safeId && !safeTitle) return "article";
  if (!safeId) return safeTitle;
  if (!safeTitle) return safeId;
  return `${safeId}-${safeTitle}`;
}

function pickImages(images?: EspnImage[]): { hero: string | null; thumb: string | null } {
  if (!images || images.length === 0) return { hero: null, thumb: null };
  const usable = images.filter((i) => typeof i.url === "string" && i.url!.length > 0);
  if (usable.length === 0) return { hero: null, thumb: null };
  const sorted = [...usable].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const hero = sorted[0]?.url ?? null;
  const thumb = sorted[sorted.length - 1]?.url ?? hero;
  return { hero, thumb };
}

function pickCategory(cats?: EspnCategory[]): string | undefined {
  if (!cats || cats.length === 0) return undefined;
  const team = cats.find((c) => c.type === "team");
  if (team?.description) return team.description;
  const league = cats.find((c) => c.type === "league");
  if (league?.description) return league.description;
  return cats[0]?.description;
}

export async function fetchWarriorsNews(
  limit = 6,
  signal?: AbortSignal,
): Promise<WarriorsNewsItem[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/news?team=9&limit=${limit}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const articles: EspnArticle[] = data.articles ?? [];
    return articles.slice(0, limit).map((a) => {
      const id = String(a.id ?? a.headline ?? "");
      const title = a.headline ?? "";
      const slug = createArticleSlug(id, title);
      const { hero, thumb } = pickImages(a.images);
      const link =
        a.links?.web?.href ?? a.links?.mobile?.href ?? "https://www.nba.com/warriors/news";
      const publishedAt = a.published
        ? new Date(a.published).toISOString()
        : new Date().toISOString();
      const updatedAt = a.lastModified ? new Date(a.lastModified).toISOString() : undefined;
      const author = a.byline?.trim() || undefined;
      const sourceName = a.source?.trim() || "ESPN";
      const category = pickCategory(a.categories);
      return {
        id,
        title,
        link,
        publishedAt,
        thumbnail: thumb,
        description: a.description ?? "",
        slug,
        image: hero,
        originalUrl: link,
        author,
        source: sourceName,
        sourceName,
        provider: sourceName,
        updatedAt,
        category,
      };
    });
  } catch (err) {
    if ((err as Error).name !== "AbortError") console.warn("fetchWarriorsNews:", err);
    return [];
  }
}
