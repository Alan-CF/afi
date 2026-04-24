const RSS_SOURCE = "https://www.nba.com/warriors/rss.xml";
const RSS2JSON = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_SOURCE)}`;

export interface WarriorsNewsItem {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
  description: string;
}

interface Rss2JsonItem {
  guid?: string;
  link: string;
  title: string;
  pubDate: string;
  thumbnail?: string;
  enclosure?: { link?: string };
  description?: string;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export async function fetchWarriorsNews(limit = 6, signal?: AbortSignal): Promise<WarriorsNewsItem[]> {
  try {
    const res = await fetch(RSS2JSON, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "ok" || !data.items) return [];
    return data.items.slice(0, limit).map((item: Rss2JsonItem) => ({
      id: item.guid ?? item.link,
      title: item.title,
      link: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      thumbnail: item.thumbnail ?? item.enclosure?.link ?? null,
      description: stripHtml(item.description ?? "").slice(0, 160),
    }));
  } catch (err) {
    if ((err as Error).name !== "AbortError") console.warn("fetchWarriorsNews:", err);
    return [];
  }
}
