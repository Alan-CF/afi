import {
  DOMParser,
  type HTMLDocument,
  type Element,
} from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";

const CORS_HEADERS = {
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

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AFI-NewsBot/1.0; +https://afi.local)";

interface Extracted {
  title: string | null;
  author: string | null;
  source: string | null;
  publishedAt: string | null;
  image: string | null;
  body: string | null;
}

function emptyArticle(originalUrl: string | null = null) {
  return {
    title: null,
    author: null,
    source: null,
    publishedAt: null,
    image: null,
    body: null,
    originalUrl,
  };
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

function fail(message: string, status = 400, originalUrl: string | null = null): Response {
  return jsonResponse({ ...emptyArticle(originalUrl), error: message }, status);
}

function isAllowedHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (ALLOWED_HOSTS.has(lower)) return true;
  for (const h of ALLOWED_HOSTS) {
    if (lower.endsWith("." + h)) return true;
  }
  return false;
}

function pickJsonLdAuthor(author: unknown): string | null {
  if (!author) return null;
  if (typeof author === "string") return author;
  if (Array.isArray(author)) {
    const first =
      (author as Array<unknown>).find(
        (a) => a && typeof a === "object" && (a as { name?: string }).name,
      ) ?? author[0];
    if (typeof first === "string") return first;
    return (first as { name?: string } | undefined)?.name ?? null;
  }
  return (author as { name?: string }).name ?? null;
}

function pickJsonLdImage(image: unknown): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    return (first as { url?: string } | undefined)?.url ?? null;
  }
  return (image as { url?: string }).url ?? null;
}

function pickJsonLdPublisher(publisher: unknown): string | null {
  if (!publisher) return null;
  if (typeof publisher === "string") return publisher;
  return (publisher as { name?: string }).name ?? null;
}

function isArticleType(t: unknown): boolean {
  if (typeof t === "string") {
    return t === "NewsArticle" || t === "Article" || t === "ReportageNewsArticle";
  }
  if (Array.isArray(t)) {
    return t.some(
      (x) =>
        typeof x === "string" &&
        (x === "NewsArticle" || x === "Article" || x === "ReportageNewsArticle"),
    );
  }
  return false;
}

function parseJsonLd(doc: HTMLDocument): Partial<Extracted> {
  const out: Partial<Extracted> = {};
  const scripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]'),
  ) as Element[];
  for (const s of scripts) {
    const txt = s.textContent ?? "";
    if (!txt.trim()) continue;
    let data: unknown;
    try {
      data = JSON.parse(txt);
    } catch {
      continue;
    }
    const root = data as { "@graph"?: unknown[] } | unknown[] | Record<string, unknown>;
    const candidates: unknown[] = Array.isArray(root)
      ? root
      : Array.isArray((root as { "@graph"?: unknown[] })["@graph"])
        ? ((root as { "@graph"?: unknown[] })["@graph"] as unknown[])
        : [root];
    for (const c of candidates) {
      if (!c || typeof c !== "object") continue;
      const obj = c as Record<string, unknown>;
      if (!isArticleType(obj["@type"])) continue;
      out.title ??=
        (obj.headline as string | undefined) ?? (obj.name as string | undefined) ?? null;
      out.author ??= pickJsonLdAuthor(obj.author);
      out.source ??= pickJsonLdPublisher(obj.publisher);
      out.publishedAt ??= (obj.datePublished as string | undefined) ?? null;
      out.image ??= pickJsonLdImage(obj.image);
      const ab = obj.articleBody;
      out.body ??= typeof ab === "string" && ab.trim().length > 0 ? ab : null;
    }
  }
  return out;
}

function metaContent(doc: HTMLDocument, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const v = el?.getAttribute("content");
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function parseMeta(doc: HTMLDocument): Partial<Extracted> {
  return {
    title: metaContent(doc, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ]),
    author: metaContent(doc, [
      'meta[name="author"]',
      'meta[property="article:author"]',
    ]),
    source: metaContent(doc, ['meta[property="og:site_name"]']),
    publishedAt: metaContent(doc, ['meta[property="article:published_time"]']),
    image: metaContent(doc, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]),
  };
}

function extractBody(doc: HTMLDocument): string | null {
  const containers = ["article", "main", '[itemprop="articleBody"]'];
  for (const sel of containers) {
    const root = doc.querySelector(sel);
    if (!root) continue;
    const ps = Array.from(root.querySelectorAll("p")) as Element[];
    const paragraphs = ps
      .map((p) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter((t) => t.length >= 40);
    if (paragraphs.length >= 2) {
      const seen = new Set<string>();
      const dedup: string[] = [];
      for (const p of paragraphs) {
        if (!seen.has(p)) {
          seen.add(p);
          dedup.push(p);
        }
      }
      const body = dedup.join("\n\n");
      if (body.length >= 200) return body;
    }
  }
  return null;
}

function toIsoSafe(v: string | null): string | null {
  if (!v) return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return v;
  return new Date(t).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "POST") {
      return fail("method not allowed", 405);
    }

    let payload: { url?: string };
    try {
      payload = await req.json();
    } catch {
      return fail("invalid json body");
    }
    const target = payload?.url;
    if (!target || typeof target !== "string") {
      return fail("missing url");
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return fail("invalid url");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return fail("unsupported protocol", 400, target);
    }
    if (!isAllowedHost(parsed.hostname)) {
      return fail("hostname not allowed", 400, parsed.toString());
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let html: string;
    try {
      const res = await fetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        signal: ctrl.signal,
        redirect: "follow",
      });
      if (!res.ok) return fail(`upstream ${res.status}`, 502, parsed.toString());
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (!ct.includes("html")) return fail("not html", 415, parsed.toString());
      html = await res.text();
      if (html.length > MAX_BYTES) {
        return fail("response too large", 413, parsed.toString());
      }
    } catch (err) {
      const reason = (err as Error).name === "AbortError" ? "timeout" : "fetch failed";
      return fail(reason, 504, parsed.toString());
    } finally {
      clearTimeout(timer);
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return fail("parse failed", 502, parsed.toString());

    const fromJsonLd = parseJsonLd(doc);
    const fromMeta = parseMeta(doc);

    const merged: Extracted = {
      title: fromJsonLd.title ?? fromMeta.title ?? null,
      author: fromJsonLd.author ?? fromMeta.author ?? null,
      source: fromJsonLd.source ?? fromMeta.source ?? null,
      publishedAt: toIsoSafe(fromJsonLd.publishedAt ?? fromMeta.publishedAt ?? null),
      image: fromJsonLd.image ?? fromMeta.image ?? null,
      body: fromJsonLd.body ?? extractBody(doc),
    };

    return jsonResponse({
      title: merged.title,
      author: merged.author,
      source: merged.source,
      publishedAt: merged.publishedAt,
      image: merged.image,
      body: merged.body,
      originalUrl: parsed.toString(),
    });
  } catch (err) {
    console.error("news-article unhandled:", err);
    return fail("internal error", 500);
  }
});
