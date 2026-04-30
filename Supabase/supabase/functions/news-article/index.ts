import { corsHeaders } from "../_shared/cors.ts";
import {
  DOMParser,
  type HTMLDocument,
  type Element,
} from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";

const CORS_HEADERS = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

const ALLOWED_HOSTS = new Set<string>([
  "espn.com",
  "www.espn.com",
  "m.espn.com",
  "global.espn.com",
  "espn.in",
  "espn.go.com",
  "www.espn.go.com",
]);

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AFI-NewsBot/1.0; +https://afi.local)";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function fail(reason: string, status = 400): Response {
  return jsonResponse({ ok: false, error: reason }, status);
}

function isAllowedHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (ALLOWED_HOSTS.has(lower)) return true;
  for (const h of ALLOWED_HOSTS) {
    if (lower.endsWith("." + h)) return true;
  }
  return false;
}

interface ExtractedArticle {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  sourceName?: string;
  publishedAt?: string;
  updatedAt?: string;
  body?: string;
}

function pickJsonLdAuthor(author: unknown): string | undefined {
  if (!author) return undefined;
  if (typeof author === "string") return author;
  if (Array.isArray(author)) {
    const first = (author as Array<unknown>).find(
      (a) => a && typeof a === "object" && (a as { name?: string }).name,
    ) ?? author[0];
    if (typeof first === "string") return first;
    return (first as { name?: string } | undefined)?.name;
  }
  return (author as { name?: string }).name;
}

function pickJsonLdImage(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    return (first as { url?: string } | undefined)?.url;
  }
  return (image as { url?: string }).url;
}

function pickJsonLdPublisher(publisher: unknown): string | undefined {
  if (!publisher) return undefined;
  if (typeof publisher === "string") return publisher;
  return (publisher as { name?: string }).name;
}

function isArticleType(t: unknown): boolean {
  if (typeof t === "string") return t === "NewsArticle" || t === "Article" || t === "ReportageNewsArticle";
  if (Array.isArray(t)) return t.some((x) => typeof x === "string" && (x === "NewsArticle" || x === "Article" || x === "ReportageNewsArticle"));
  return false;
}

function parseJsonLd(doc: HTMLDocument): Partial<ExtractedArticle> {
  const out: Partial<ExtractedArticle> = {};
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')) as Element[];
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
      out.title ??= (obj.headline as string | undefined) ?? (obj.name as string | undefined);
      out.description ??= obj.description as string | undefined;
      out.image ??= pickJsonLdImage(obj.image);
      out.author ??= pickJsonLdAuthor(obj.author);
      out.sourceName ??= pickJsonLdPublisher(obj.publisher);
      out.publishedAt ??= obj.datePublished as string | undefined;
      out.updatedAt ??= obj.dateModified as string | undefined;
      out.body ??= typeof obj.articleBody === "string" ? (obj.articleBody as string) : undefined;
    }
  }
  return out;
}

function metaContent(doc: HTMLDocument, selectors: string[]): string | undefined {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const v = el?.getAttribute("content");
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

function parseMeta(doc: HTMLDocument): Partial<ExtractedArticle> {
  return {
    title: metaContent(doc, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ]),
    description: metaContent(doc, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
    image: metaContent(doc, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]),
    publishedAt: metaContent(doc, [
      'meta[property="article:published_time"]',
    ]),
    updatedAt: metaContent(doc, [
      'meta[property="article:modified_time"]',
    ]),
    author: metaContent(doc, [
      'meta[name="author"]',
      'meta[property="article:author"]',
    ]),
    sourceName: metaContent(doc, ['meta[property="og:site_name"]']),
  };
}

function extractBody(doc: HTMLDocument): string | undefined {
  const containers = ["article", "main", '[itemprop="articleBody"]'];
  let paragraphs: string[] = [];
  for (const sel of containers) {
    const root = doc.querySelector(sel);
    if (!root) continue;
    const ps = Array.from(root.querySelectorAll("p")) as Element[];
    paragraphs = ps
      .map((p) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter((t) => t.length >= 40);
    if (paragraphs.length >= 2) break;
  }
  if (paragraphs.length < 2) return undefined;
  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const p of paragraphs) {
    if (!seen.has(p)) {
      seen.add(p);
      dedup.push(p);
    }
  }
  const body = dedup.join("\n\n");
  if (body.length < 200) return undefined;
  return body;
}

function merge(
  a: Partial<ExtractedArticle>,
  b: Partial<ExtractedArticle>,
): Partial<ExtractedArticle> {
  const out: Partial<ExtractedArticle> = { ...a };
  for (const k of Object.keys(b) as (keyof ExtractedArticle)[]) {
    if (!out[k] && b[k]) out[k] = b[k] as ExtractedArticle[typeof k];
  }
  return out;
}

function toIsoSafe(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return v;
  return new Date(t).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "GET") {
      return fail("method not allowed", 405);
    }

    const reqUrl = new URL(req.url);
    const target = reqUrl.searchParams.get("url");
    if (!target) return fail("missing url");

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return fail("invalid url");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return fail("unsupported protocol");
    }
    if (!isAllowedHost(parsed.hostname)) {
      return fail("hostname not allowed");
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
      if (!res.ok) return fail(`upstream ${res.status}`, 502);
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (!ct.includes("html")) return fail("not html", 415);
      html = await res.text();
      if (html.length > MAX_BYTES) return fail("response too large", 413);
    } catch (err) {
      return fail((err as Error).name === "AbortError" ? "timeout" : "fetch failed", 504);
    } finally {
      clearTimeout(timer);
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return fail("parse failed", 502);

    const fromJsonLd = parseJsonLd(doc);
    const fromMeta = parseMeta(doc);
    const merged = merge(fromJsonLd, fromMeta);
    if (!merged.body) {
      const body = extractBody(doc);
      if (body) merged.body = body;
    }

    return jsonResponse({
      ok: true,
      article: {
        title: merged.title,
        description: merged.description,
        image: merged.image,
        author: merged.author,
        sourceName: merged.sourceName,
        publishedAt: toIsoSafe(merged.publishedAt),
        updatedAt: toIsoSafe(merged.updatedAt),
        body: merged.body,
        originalUrl: parsed.toString(),
      },
    });
  } catch (err) {
    console.error("news-article unhandled:", err);
    return fail("internal error", 500);
  }
});
