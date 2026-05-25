import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

const ALLOWED_HOSTS = new Set<string>([
  "espn.com",
  "www.espn.com",
  "m.espn.com",
  "espn.go.com",
  "www.espn.go.com",
  "global.espn.com",
  "espn.in",
]);

const FORBIDDEN_HOSTS = new Set<string>([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const FORBIDDEN_PROTOCOLS = new Set<string>([
  "file:",
  "data:",
  "javascript:",
  "ftp:",
  "ws:",
  "wss:",
]);

const APIFY_DEFAULT_ACTOR = "apify/website-content-crawler";
const APIFY_TIMEOUT_MS = 60_000;
const MIN_BODY_CHARS = 300;
const MIN_PARAGRAPHS = 2;
const MIN_PARAGRAPH_CHARS = 40;
const CACHE_TABLE = "news_article_cache";

interface RequestPayload {
  url?: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  source?: string | null;
}

interface ArticleResponse {
  title: string | null;
  author: string | null;
  source: string | null;
  publishedAt: string | null;
  image: string | null;
  body: string | null;
  bodyParagraphs: string[];
  originalUrl: string;
  provider: "cache" | "apify" | null;
  error: string | null;
}

interface CacheRow {
  original_url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  source: string | null;
  published_at: string | null;
  body: string | null;
  body_paragraphs: string[] | null;
  provider: string | null;
}

interface ApifyItem {
  text?: string;
  markdown?: string;
  content?: string;
  pageContent?: string;
  title?: string;
  metadata?: {
    title?: string;
    author?: string;
    description?: string;
    publishedAt?: string;
    publishedTime?: string;
    image?: string;
    source?: string;
    siteName?: string;
  };
  author?: string;
  byline?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function emptyResponse(
  originalUrl: string,
  error: string | null,
  meta?: Partial<ArticleResponse>,
): ArticleResponse {
  return {
    title: meta?.title ?? null,
    author: meta?.author ?? null,
    source: meta?.source ?? null,
    publishedAt: meta?.publishedAt ?? null,
    image: meta?.image ?? null,
    body: null,
    bodyParagraphs: [],
    originalUrl,
    provider: null,
    error,
  };
}

function isPrivateIp(host: string): boolean {
  if (FORBIDDEN_HOSTS.has(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(host)) return true;
  return false;
}

function isAllowedHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (ALLOWED_HOSTS.has(lower)) return true;
  for (const h of ALLOWED_HOSTS) {
    if (lower.endsWith("." + h)) return true;
  }
  return false;
}

function validateUrl(raw: unknown): { url: URL | null; error: string | null } {
  if (!raw || typeof raw !== "string")
    return { url: null, error: "missing url" };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: null, error: "invalid url" };
  }
  if (FORBIDDEN_PROTOCOLS.has(parsed.protocol)) {
    return { url: null, error: "forbidden protocol" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { url: null, error: "unsupported protocol" };
  }
  const host = parsed.hostname.toLowerCase();
  if (isPrivateIp(host))
    return { url: null, error: "private host not allowed" };
  if (!isAllowedHost(host)) return { url: null, error: "hostname not allowed" };
  return { url: parsed, error: null };
}

function getServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readCache(
  client: SupabaseClient,
  originalUrl: string,
): Promise<CacheRow | null> {
  const { data, error } = await client
    .from(CACHE_TABLE)
    .select(
      "original_url,title,description,image_url,source,published_at,body,body_paragraphs,provider",
    )
    .eq("original_url", originalUrl)
    .maybeSingle();
  if (error) {
    console.error("news-article cache read failed:", error.message);
    return null;
  }
  return data as CacheRow | null;
}

async function writeCache(
  client: SupabaseClient,
  row: {
    original_url: string;
    title: string | null;
    description: string | null;
    image_url: string | null;
    source: string | null;
    published_at: string | null;
    body: string;
    body_paragraphs: string[];
    provider: string;
  },
): Promise<void> {
  const { error } = await client.from(CACHE_TABLE).upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "original_url" },
  );
  if (error) {
    console.error("news-article cache write failed:", error.message);
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

const NAVIGATION_PATTERNS: RegExp[] = [
  /^(home|news|scores|standings|schedule|stats|teams|players|watch|listen)$/i,
  /^(more|menu|search|sign in|log in|subscribe|follow|share|tweet|comments?)$/i,
  /^(facebook|twitter|instagram|threads|tiktok|youtube|reddit|copy link)$/i,
  /^(read more|continue reading|next|previous|loading|advertisement|sponsored)$/i,
  /^(privacy policy|terms of use|cookie policy|do not sell|nielsen measurement|copyright)/i,
  /^©/,
  /espn\s*plus/i,
  /^enjoying this article/i,
];

const NOISE_LINE_PATTERNS: RegExp[] = [
  /^(watch|read|listen):/i,
  /^play\s+video/i,
  /^video duration/i,
  /^embed\s+code/i,
  /^getty images$/i,
  /^ap photo$/i,
  /^photo:/i,
  /^image:/i,
  /^caption:/i,
  /^\d{1,2}:\d{2}$/,
  /^\d+\s+(comments?|shares?|likes?|views?)/i,
];

function isNoiseLine(line: string): boolean {
  if (line.length < 30) {
    for (const re of NAVIGATION_PATTERNS) {
      if (re.test(line)) return true;
    }
  }
  for (const re of NOISE_LINE_PATTERNS) {
    if (re.test(line)) return true;
  }
  return false;
}

function toParagraphs(cleaned: string): string[] {
  const blocks = cleaned
    .split(/\n{2,}/)
    .map((b) =>
      b
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const fromMarkdown =
    blocks.length > 1
      ? blocks
      : cleaned
          .split(/\n+/)
          .map((b) => b.trim())
          .filter(Boolean);

  const filtered: string[] = [];
  const seen = new Set<string>();
  for (const raw of fromMarkdown) {
    const p = raw.replace(/^[#>*\-•·\d\.\)\s]+/, "").trim();
    if (!p) continue;
    if (p.length < MIN_PARAGRAPH_CHARS) continue;
    if (isNoiseLine(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(p);
  }
  return filtered;
}

function extractRawText(item: ApifyItem): string {
  const candidates = [item.text, item.markdown, item.content, item.pageContent];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c;
  }
  return "";
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  return new Date(t).toISOString();
}

async function callApify(targetUrl: string): Promise<ApifyItem | null> {
  const token = Deno.env.get("APIFY_TOKEN");
  if (!token) {
    console.error("APIFY_TOKEN not configured");
    return null;
  }
  const actorId = (
    Deno.env.get("APIFY_ACTOR_ID") ?? APIFY_DEFAULT_ACTOR
  ).trim();
  const safeActorId = actorId.replace("/", "~");

  const endpoint = `https://api.apify.com/v2/acts/${safeActorId}/run-sync-get-dataset-items?token=${encodeURIComponent(
    token,
  )}`;

  const body = {
    startUrls: [{ url: targetUrl }],
    crawlerType: "playwright:adaptive",
    maxCrawlPages: 1,
    maxCrawlDepth: 0,
    maxResults: 1,
    proxyConfiguration: { useApifyProxy: true },
    saveMarkdown: true,
    saveHtml: false,
    saveFiles: false,
    saveScreenshots: false,
    removeCookieWarnings: true,
    removeElementsCssSelector:
      "nav, footer, header, aside, script, style, .ad, .ads, .advertisement, .related, .recommended",
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), APIFY_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.error(`apify run-sync returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] as ApifyItem;
  } catch (err) {
    const reason =
      (err as Error).name === "AbortError" ? "timeout" : (err as Error).message;
    console.error("apify call failed:", reason);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function handlePost(req: Request): Promise<Response> {
  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(emptyResponse("", "invalid json body"), 400);
  }

  const { url, error: urlError } = validateUrl(payload.url);
  if (!url) {
    return jsonResponse(
      emptyResponse(
        typeof payload.url === "string" ? payload.url : "",
        urlError,
      ),
      400,
    );
  }

  const originalUrl = url.toString();
  const fallbackMeta: Partial<ArticleResponse> = {
    title: payload.title ?? null,
    image: payload.image ?? null,
    publishedAt: toIso(payload.publishedAt ?? null),
    source: payload.source ?? null,
  };

  const client = getServiceClient();

  if (client) {
    const cached = await readCache(client, originalUrl);
    if (
      cached &&
      cached.body &&
      cached.body.length >= MIN_BODY_CHARS &&
      Array.isArray(cached.body_paragraphs) &&
      cached.body_paragraphs.length >= MIN_PARAGRAPHS
    ) {
      const response: ArticleResponse = {
        title: cached.title ?? fallbackMeta.title ?? null,
        author: null,
        source: cached.source ?? fallbackMeta.source ?? null,
        publishedAt: cached.published_at ?? fallbackMeta.publishedAt ?? null,
        image: cached.image_url ?? fallbackMeta.image ?? null,
        body: cached.body,
        bodyParagraphs: cached.body_paragraphs,
        originalUrl,
        provider: "cache",
        error: null,
      };
      return jsonResponse(response, 200);
    }
  }

  const apifyItem = await callApify(originalUrl);
  if (!apifyItem) {
    return jsonResponse(
      emptyResponse(originalUrl, "extractor unavailable", fallbackMeta),
      200,
    );
  }

  const rawText = extractRawText(apifyItem);
  if (!rawText) {
    return jsonResponse(
      emptyResponse(originalUrl, "no content extracted", fallbackMeta),
      200,
    );
  }

  const cleaned = cleanText(rawText);
  const paragraphs = toParagraphs(cleaned);
  const body = paragraphs.join("\n\n");

  if (paragraphs.length < MIN_PARAGRAPHS || body.length < MIN_BODY_CHARS) {
    return jsonResponse(
      emptyResponse(originalUrl, "content too short", fallbackMeta),
      200,
    );
  }

  const meta = apifyItem.metadata ?? {};
  const title = meta.title ?? apifyItem.title ?? fallbackMeta.title ?? null;
  const author = meta.author ?? apifyItem.author ?? apifyItem.byline ?? null;
  const source = meta.source ?? meta.siteName ?? fallbackMeta.source ?? null;
  const publishedAt = toIso(
    meta.publishedAt ?? meta.publishedTime ?? fallbackMeta.publishedAt ?? null,
  );
  const image = meta.image ?? fallbackMeta.image ?? null;
  const description = meta.description ?? payload.description ?? null;

  if (client) {
    await writeCache(client, {
      original_url: originalUrl,
      title,
      description,
      image_url: image,
      source,
      published_at: publishedAt,
      body,
      body_paragraphs: paragraphs,
      provider: "apify",
    });
  }

  const response: ArticleResponse = {
    title,
    author,
    source,
    publishedAt,
    image,
    body,
    bodyParagraphs: paragraphs,
    originalUrl,
    provider: "apify",
    error: null,
  };
  return jsonResponse(response, 200);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(emptyResponse("", "method not allowed"), 405);
  }
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("news-article unhandled:", err);
    return jsonResponse(emptyResponse("", "internal error"), 200);
  }
});
