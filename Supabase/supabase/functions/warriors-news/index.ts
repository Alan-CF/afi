// deno-lint-ignore no-explicit-any
declare const Deno: any;

interface WarriorsNewsItem {
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

interface WorldNewsArticle {
  id: number;
  title: string;
  text: string;
  url: string;
  image: string | null;
  publish_date: string;
  author: string | null;
  authors: string[] | null;
  source_country: string | null;
}

interface WorldNewsResponse {
  news: WorldNewsArticle[];
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(id: string, title: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${id}-${titleSlug}`;
}

function mapArticle(article: WorldNewsArticle): WarriorsNewsItem {
  return {
    id: String(article.id),
    title: article.title,
    link: article.url,
    publishedAt: new Date(article.publish_date).toISOString(),
    thumbnail: article.image,
    description: (article.text || "").slice(0, 200),
    slug: slugify(String(article.id), article.title),
    image: article.image,
    originalUrl: article.url,
    author: article.author ?? article.authors?.[0] ?? undefined,
    source: article.source_country ?? undefined,
    sourceName: article.source_country ?? undefined,
    provider: "WorldNewsAPI",
    body: article.text || undefined,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    } as Record<string, string>,
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    let payload: { limit?: number } = {};
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "invalid json body" }, 400);
    }

    const limit = Math.min(Math.max(payload?.limit ?? 10, 1), 50);

    const apiKey = Deno.env.get("WORLDNEWS_API_KEY");
    if (!apiKey) {
      console.error("WORLDNEWS_API_KEY not configured");
      return jsonResponse({ error: "news service not configured" }, 500);
    }

    const params = new URLSearchParams({
      text: "Golden State Warriors NBA",
      language: "en",
      number: String(limit),
      sort: "publish-time",
      "sort-direction": "DESC",
    });

    const url = `https://api.worldnewsapi.com/search-news?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "User-Agent":
          "Mozilla/5.0 (compatible; AFI-NewsBot/1.0; +https://afi.local)",
      },
    });

    if (!res.ok) {
      console.error(`WorldNewsAPI returned ${res.status}`);
      return jsonResponse({ error: "upstream error", results: [] }, 502);
    }

    const data = (await res.json()) as WorldNewsResponse;

    if (!data.news || !Array.isArray(data.news)) {
      return jsonResponse({ results: [] }, 200);
    }

    const articles = data.news.slice(0, limit).map(mapArticle);

    return jsonResponse({ results: articles }, 200);
  } catch (err) {
    console.error("warriors-news error:", err);
    return jsonResponse({ error: "internal error", results: [] }, 500);
  }
};

Deno.serve(handler);
