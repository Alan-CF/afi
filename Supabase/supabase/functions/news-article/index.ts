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
const MIN_KEYWORD_MATCHES = 2;
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

function isVideoUrl(url: URL): boolean {
  return /\/video\/clip\//i.test(url.pathname);
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

async function deleteCacheRow(
  client: SupabaseClient,
  originalUrl: string,
): Promise<void> {
  const { error } = await client
    .from(CACHE_TABLE)
    .delete()
    .eq("original_url", originalUrl);
  if (error) {
    console.error("news-article cache delete failed:", error.message);
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
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
  /^play$/i,
  /^video duration/i,
  /^embed\s+code/i,
  /^getty images$/i,
  /^ap photo$/i,
  /^ap images$/i,
  /^photo:/i,
  /^image:/i,
  /^caption:/i,
  /^\d{1,2}:\d{2}$/,
  /^\d+\s+(comments?|shares?|likes?|views?)/i,
  /^stephen a[\s\.:]/i,
  /\(\d{1,2}:\d{2}\)\s*$/,
  /-imagn images$/i,
  /-getty images$/i,
  /-ap images$/i,
  /^editor[''’]?s\s+picks$/i,
  /^by\s+[A-Z][A-Za-z'’\-]+(\s+[A-Z][A-Za-z'’\-\.]+){0,3}$/,
  /^[A-Z][A-Za-z'’\-]+(\s+[A-Z][A-Za-z'’\-\.]+){0,2}\s+is\s+a\s+(senior\s+)?(writer|reporter|columnist|analyst|contributor)/i,
  /^[A-Z][A-Za-z'’\-\.]+(\s+(and|with|&)\s+[A-Z][A-Za-z'’\-\.]+)?(\s+[A-Z][A-Za-z'’\-\.]+){0,3}\s+(discuss(es)?|disagrees?|reacts?|debates?|argues?|breaks?\s+down|talks?\s+about|weighs?\s+in|previews?|recaps?|addresses?|explains?|highlights?|makes?\s+(his|her|their)\s+case)\b/,
  /^most\s+consecutive\s+playoff/i,
  /^(eastern|western)\s+conference\s+finals\s+on\s+(espn|abc|tnt|nbc|peacock)/i,
  /^20\d{2}\s+nba\s+(postseason|playoffs|finals)$/i,
  /^espn\s+has\s+you\s+covered/i,
  /^•\s+/,
  /^\*\s+if\s+necessary/i,
  /^all\s+games\s+tip\s+off/i,
  /^(mon|tue|wed|thu|fri|sat|sun)(day|sday|nesday|rsday|urday)?\.?(,?\s+[A-Z][a-z]+\s+\d+)?:\s+[A-Z]/i,
  /looking\s+to\s+get\s+back\s+to\s+the\s+nba\s+finals/i,
  /^game\s+\d+:\s+[A-Za-z]+\s+(at|vs\.?)\s+[A-Za-z]/i,
  /^check\s+out\s+the\s+espn/i,
  /^visit\s+espn\b/i,
  /^for\s+more\s+(nba|coverage|stories)/i,
  /^ap\s+photo\s*\/\s*file\s*$/i,
  /^['‘"][^'’"]{1,120}['’"]:\s+[A-Z]/,
  /pic\.twitter\.com\//i,
  /—\s*@?[A-Za-z0-9_\.\s]+\(@[A-Za-z0-9_]+\)\s+[A-Z][a-z]+\s+\d+,?\s+20\d{2}\s*$/,
  /^@[A-Za-z0-9_]+\s+(May|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar)\s+\d+,?\s+20\d{2}\s*$/,
];

const STOP_MARKERS: RegExp[] = [
  /^20\d{2}\s+(nba|wnba)\s+playoffs?\s*:/i,
  /^nba\s+playoffs?\s*:/i,
  /^nba\s+playoff\s+takeaways?\s*:/i,
  /^as\s+it\s+happened\s*:?/i,
  /^latest\s+nba\s+buzz\s*:?/i,
  /^open\s+extended\s+reactions/i,
  /^the\s+conference\s+finals\s+of\s+the\s+20\d{2}\s+nba\s+playoffs/i,
  /^victor\s+wembanyama\s+sets\s+tone/i,
  /^thunder\s+held\s+to\s+worst/i,
  /^condiciones\s+para\s+el\s+uso/i,
  /^terms\s+of\s+(use|service)/i,
  /^privacy\s+policy/i,
  /^gambling\s+problem/i,
  /^copyright\s*:?/i,
  /^items\s+per\s+page/i,
  /^go\s+to\s+page/i,
  /^©/,
  /^more\s+from\s+espn/i,
  /^you\s+might\s+also\s+like/i,
  /^trending\s+now/i,
  /^most\s+popular/i,
  /^top\s+headlines/i,
  /^related\s+(stories|articles|content|videos?)/i,
  /^continue\s+reading/i,
  /^sign\s+up\s+for/i,
  /^download\s+the\s+espn/i,
  /^get\s+the\s+espn/i,
  /^do\s+not\s+sell/i,
  /^nielsen\s+measurement/i,
  /^children[''’]?s\s+online\s+privacy/i,
  /^interest-based\s+ads/i,
];

const HARD_REJECT_OPENERS: RegExp[] = [
  /^the\s+conference\s+finals\s+of\s+the\s+20\d{2}\s+nba\s+playoffs/i,
  /^victor\s+wembanyama\s+sets\s+tone/i,
  /^thunder\s+held\s+to\s+worst/i,
  /^nba\s+playoff\s+takeaways/i,
  /^20\d{2}\s+nba\s+playoffs?\s*:/i,
];

const REQUESTED_PLAYOFF_HINT =
  /\b(conference\s+finals?|playoffs?|takeaways?|wembanyama|gilgeous)\b/i;

function startsWithHardRejectOpener(
  body: string,
  title: string,
  description: string,
): boolean {
  if (!body) return false;
  const refLower = `${title || ""} ${description || ""}`;
  if (REQUESTED_PLAYOFF_HINT.test(refLower)) return false;
  const head = body.trim().slice(0, 240);
  return HARD_REJECT_OPENERS.some((re) => re.test(head));
}

function isStopMarker(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return STOP_MARKERS.some((re) => re.test(t));
}

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

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string): string {
  return normalizeForMatch(title.replace(/\s*[-|–—]\s*espn\s*$/i, ""));
}

const KEYWORD_STOPWORDS = new Set<string>([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "they",
  "their",
  "have",
  "will",
  "were",
  "was",
  "been",
  "being",
  "because",
  "about",
  "into",
  "over",
  "under",
  "out",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "than",
  "then",
  "only",
  "also",
  "just",
  "said",
  "says",
  "its",
  "her",
  "his",
  "him",
  "our",
  "your",
  "you",
  "off",
  "one",
  "two",
  "three",
  "more",
  "most",
  "less",
  "many",
  "some",
  "any",
  "all",
  "very",
  "too",
  "now",
  "again",
  "still",
  "back",
  "here",
  "there",
  "make",
  "made",
  "team",
  "game",
  "season",
  "year",
  "years",
  "league",
  "sports",
  "warrior",
  "warriors",
  "nba",
  "espn",
  "article",
  "story",
  "news",
  "staff",
  "report",
  "reports",
  "top",
  "best",
  "first",
  "last",
  "next",
  "play",
  "plays",
  "playing",
  "played",
  "win",
  "wins",
  "won",
  "lost",
  "loss",
  "beat",
  "beats",
  "like",
  "just",
  "into",
  "onto",
  "over",
  "upon",
  "much",
  "such",
  "both",
  "each",
  "every",
  "other",
  "another",
  "these",
  "those",
  "while",
  "after",
  "before",
  "until",
  "since",
  "through",
  "during",
  "without",
  "within",
  "against",
]);

const STRICT_STOPWORDS_EXTRA = new Set<string>([
  "golden",
  "state",
  "star",
  "stars",
  "music",
  "basketball",
  "point",
  "points",
  "video",
  "watch",
  "season",
  "seasons",
  "title",
  "headline",
  "subtitle",
]);

const UNRELATED_HEAVY_TERMS: string[] = [
  "spurs",
  "thunder",
  "wembanyama",
  "gilgeous",
  "alexander",
  "cavaliers",
  "knicks",
  "pacers",
  "timberwolves",
  "mavericks",
  "jokic",
  "doncic",
  "luka",
  "tatum",
  "celtics",
  "heat",
  "nuggets",
  "sixers",
  "rockets",
  "jazz",
  "grizzlies",
  "raptors",
  "hawks",
  "bucks",
  "suns",
  "clippers",
  "lakers",
  "conference finals",
  "playoff takeaways",
];

function tokenizeStrict(text: string): string[] {
  const lowered = (text || "").toLowerCase();
  const tokens = lowered.split(/[^a-z0-9']+/);
  const out = new Set<string>();
  for (const raw of tokens) {
    const clean = raw.replace(/^'+|'+$/g, "");
    if (clean.length < 4) continue;
    if (KEYWORD_STOPWORDS.has(clean)) continue;
    if (STRICT_STOPWORDS_EXTRA.has(clean)) continue;
    out.add(clean);
  }
  return [...out];
}

function extractTitleKeywords(title: string): string[] {
  const stripped = (title || "").replace(/\s*[-|–—]\s*espn\s*$/i, "");
  return tokenizeStrict(stripped);
}

function extractDescriptionKeywords(description: string): string[] {
  return tokenizeStrict(description || "");
}

function isTitleParagraph(paragraph: string, title: string): boolean {
  const pKey = normalizeForMatch(paragraph);
  const tKey = normalizeTitle(title);
  if (!pKey || !tKey) return false;
  if (pKey === tKey) return true;
  if (pKey.startsWith(tKey)) return true;
  if (tKey.startsWith(pKey) && pKey.length >= tKey.length * 0.6) return true;
  const titleWords = tKey
    .split(" ")
    .filter((w) => w.length >= 3 && !KEYWORD_STOPWORDS.has(w));
  if (titleWords.length < 2) return false;
  const pSet = new Set(pKey.split(" "));
  let hits = 0;
  for (const w of titleWords) if (pSet.has(w)) hits++;
  const overlap = hits / titleWords.length;
  if (paragraph.length <= 220 && overlap >= 0.7) return true;
  return false;
}

function stripTitleParagraphs(paragraphs: string[], title: string): string[] {
  if (paragraphs.length === 0) return paragraphs;
  const result = [...paragraphs];
  while (result.length > 0 && isTitleParagraph(result[0], title)) {
    result.shift();
  }
  return result;
}

function countUnrelatedHeavy(
  body: string,
  title: string,
  description: string,
): number {
  const lower = body.toLowerCase();
  const refLower = `${title || ""} ${description || ""}`.toLowerCase();
  let count = 0;
  for (const term of UNRELATED_HEAVY_TERMS) {
    if (refLower.includes(term)) continue;
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`);
    if (re.test(lower)) count++;
  }
  return count;
}

interface ValidationResult {
  valid: boolean;
  contentParagraphs: string[];
  reason?: string;
}

function validateBodyBelongsToArticle(
  paragraphs: string[],
  title: string,
  description: string,
): ValidationResult {
  const contentParagraphs = stripTitleParagraphs(paragraphs, title);
  const contentBody = contentParagraphs.join("\n\n");

  if (
    contentParagraphs.length < MIN_PARAGRAPHS ||
    contentBody.length < MIN_BODY_CHARS
  ) {
    return {
      valid: false,
      contentParagraphs,
      reason: "content too short after title removal",
    };
  }

  if (startsWithHardRejectOpener(contentBody, title, description)) {
    return {
      valid: false,
      contentParagraphs,
      reason: "body opens with unrelated article lead",
    };
  }

  const titleKeywords = extractTitleKeywords(title);
  const descKeywords = extractDescriptionKeywords(description);

  const titleMatches = countKeywordMatches(contentBody, titleKeywords);
  const descMatches = countKeywordMatches(contentBody, descKeywords);

  const unrelatedHeavy = countUnrelatedHeavy(contentBody, title, description);

  if (unrelatedHeavy >= 3) {
    const strongTitle = titleMatches >= 4;
    const strongDesc = descMatches >= 3;
    if (!strongTitle && !strongDesc) {
      return {
        valid: false,
        contentParagraphs,
        reason: "unrelated-heavy content without strong requested evidence",
      };
    }
  }

  if (titleMatches < MIN_KEYWORD_MATCHES) {
    return {
      valid: false,
      contentParagraphs,
      reason: "insufficient title keyword matches in content body",
    };
  }

  if (descKeywords.length >= 3 && descMatches < 1) {
    return {
      valid: false,
      contentParagraphs,
      reason: "insufficient description keyword matches in content body",
    };
  }

  return { valid: true, contentParagraphs };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countKeywordMatches(body: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const lower = body.toLowerCase();
  let matches = 0;
  for (const k of keywords) {
    const re = new RegExp(`\\b${escapeRegex(k)}\\b`);
    if (re.test(lower)) matches++;
  }
  return matches;
}

function findTitleLine(lines: string[], title: string): number {
  const all = findAllTitleLines(lines, title);
  return all.length > 0 ? all[0] : -1;
}

function findAllTitleLines(lines: string[], title: string): number[] {
  const titleNorm = normalizeTitle(title);
  if (!titleNorm) return [];
  const titleWords = titleNorm
    .split(" ")
    .filter((w) => w.length >= 3 && !KEYWORD_STOPWORDS.has(w));
  if (titleWords.length < 2) return [];
  const required = Math.max(2, Math.ceil(titleWords.length * 0.6));
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length > 260) continue;
    const lineNorm = normalizeForMatch(line);
    if (!lineNorm) continue;
    const lineSet = new Set(lineNorm.split(" "));
    let score = 0;
    for (const w of titleWords) if (lineSet.has(w)) score++;
    if (score >= required) hits.push(i);
  }
  return hits;
}

function earlyBodyMatchesRequest(
  earlyBody: string,
  title: string,
  description: string,
): boolean {
  const titleKw = extractTitleKeywords(title);
  const descKw = extractDescriptionKeywords(description);
  const combined = new Set<string>([...titleKw, ...descKw]);
  if (combined.size === 0) return true;
  const lower = earlyBody.toLowerCase();
  let matches = 0;
  for (const k of combined) {
    if (new RegExp(`\\b${escapeRegex(k)}\\b`).test(lower)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

function findDescriptionLine(lines: string[], description: string): number {
  if (!description) return -1;
  const descNorm = normalizeForMatch(description);
  const descWords = descNorm
    .split(" ")
    .filter((w) => w.length >= 4 && !KEYWORD_STOPWORDS.has(w))
    .slice(0, 10);
  if (descWords.length < 3) return -1;
  const required = Math.max(3, Math.ceil(descWords.length * 0.6));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const lineNorm = normalizeForMatch(line);
    if (!lineNorm) continue;
    const lineSet = new Set(lineNorm.split(" "));
    let score = 0;
    for (const w of descWords) if (lineSet.has(w)) score++;
    if (score >= required) return i;
  }
  return -1;
}

function sliceArticleSegment(lines: string[], bodyStart: number): string {
  if (bodyStart >= lines.length) return "";
  let endIdx = lines.length;
  for (let i = bodyStart; i < lines.length; i++) {
    if (isStopMarker(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(bodyStart, endIdx).join("\n").trim();
}

function buildOutcomeFromSegment(
  segment: string,
  title: string,
  description: string,
): ExtractionOutcome | null {
  if (!segment) return null;
  const paragraphs = toParagraphs(segment);
  if (paragraphs.length < MIN_PARAGRAPHS) return null;
  const content = stripTitleParagraphs(paragraphs, title);
  if (content.length < MIN_PARAGRAPHS) return null;
  const body = content.join("\n\n");
  if (body.length < MIN_BODY_CHARS) return null;
  if (startsWithHardRejectOpener(body, title, description)) return null;
  const earlyBody = body.slice(0, 1000);
  if (!earlyBodyMatchesRequest(earlyBody, title, description)) return null;
  return { body, paragraphs: content };
}

function looksLikeMarkdown(raw: string): boolean {
  if (!raw) return false;
  return (
    /^\s*#{1,6}\s+/m.test(raw) ||
    /\[[^\]\n]+\]\([^)\s]+\)/.test(raw) ||
    /!\[[^\]\n]*\]\([^)\s]+\)/.test(raw) ||
    /\\[\[\]*_.()]/.test(raw)
  );
}

function markdownToPlainText(raw: string): string {
  let out = raw;
  out = out.replace(/!\[[^\]\n]*\]\([^)\s]+(?:\s+"[^"]*")?\)/g, "");
  out = out.replace(/\[([^\]\n]+)\]\([^)\s]+(?:\s+"[^"]*")?\)/g, "$1");
  out = out.replace(/^\s*#{1,6}\s+/gm, "");
  out = out.replace(/^\s{0,3}>\s?/gm, "");
  out = out.replace(/^\s*[-*+]\s+/gm, "");
  out = out.replace(/\\([\[\]\\()*_`#+\-.!>])/g, "$1");
  out = out.replace(/(\*\*|__)(.+?)\1/g, "$2");
  out = out.replace(
    /(?<![A-Za-z0-9])(\*|_)(?=\S)([^*_\n]+?)\1(?![A-Za-z0-9])/g,
    "$2",
  );
  out = out.replace(/`([^`\n]+)`/g, "$1");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

function tryExtractCandidate(
  rawText: string,
  title: string,
  description: string,
): ExtractionOutcome | null {
  const normalized = looksLikeMarkdown(rawText)
    ? markdownToPlainText(rawText)
    : rawText;
  const cleaned = cleanText(normalized);
  if (!cleaned) return null;
  const lines = cleaned.split("\n");

  let best: ExtractionOutcome | null = null;
  const titleIdxs = findAllTitleLines(lines, title);
  for (const idx of titleIdxs) {
    const segment = sliceArticleSegment(lines, idx + 1);
    const outcome = buildOutcomeFromSegment(segment, title, description);
    if (outcome && (!best || outcome.body.length > best.body.length)) {
      best = outcome;
    }
  }
  if (best) return best;

  const descIdx = findDescriptionLine(lines, description);
  if (descIdx !== -1) {
    const segment = sliceArticleSegment(lines, descIdx);
    const outcome = buildOutcomeFromSegment(segment, title, description);
    if (outcome) return outcome;
  }

  return null;
}

function stripTrailingCredit(p: string): string {
  return p
    .replace(
      /\s*\((?:Photo\s+by[^)]*|[^)]*?\b(?:AP\s+Photo(?:\s*\/\s*File)?|Getty\s+Images|Imagn\s+Images|USA\s+Today(?:\s+Images)?|EPA\s+Images?|Reuters|AFP|NBAE\s+via\s+Getty\s+Images|via\s+Getty\s+Images))\)\s*$/i,
      "",
    )
    .replace(
      /[\s\.\,\-—–·•]+(?:AP\s+Photo(?:\s*\/\s*File)?|Getty\s+Images|Imagn\s+Images|USA\s+Today(?:\s+Images)?|EPA\s+Images?|Reuters|AFP|NBAE\s+via\s+Getty\s+Images|via\s+Getty\s+Images)\s*$/i,
      "",
    )
    .trim();
}

function sanitizeCachedParagraphs(paragraphs: string[]): {
  paragraphs: string[];
  changed: boolean;
} {
  const seen = new Set<string>();
  const out: string[] = [];
  let changed = false;
  for (const raw of paragraphs) {
    const initial = typeof raw === "string" ? raw.trim() : "";
    if (!initial) {
      changed = true;
      continue;
    }
    const stripped = stripTrailingCredit(initial);
    const p = stripped;
    if (!p) {
      changed = true;
      continue;
    }
    if (p !== initial) changed = true;
    if (isNoiseLine(p)) {
      changed = true;
      continue;
    }
    const key = p.toLowerCase();
    if (seen.has(key)) {
      changed = true;
      continue;
    }
    seen.add(key);
    out.push(p);
  }
  return { paragraphs: out, changed };
}

function isRankLine(p: string): boolean {
  return /^\d{1,2}\.\s+[A-Z]/.test(p);
}

function isSectionHeader(p: string): boolean {
  if (!p) return false;
  if (/^(unrestricted|restricted)\s+free\s+agents?$/i.test(p)) return true;
  if (/^player\s+options?$/i.test(p)) return true;
  if (/^other\s+notable\b/i.test(p)) return true;
  if (/^jump\s+to\s+a\s+section/i.test(p)) return true;
  if (/^first\s+round$/i.test(p)) return true;
  if (/^second\s+round$/i.test(p)) return true;
  if (/^combine\s+measurements$/i.test(p)) return true;
  return false;
}

function isPickInfoLine(p: string): boolean {
  if (!p) return false;
  if (
    /^[A-Z][A-Za-z'’\-\.\s]+(?:\s*\([^)]+\))?\s*,\s*[A-Z][A-Z\/]{0,5}\s*,\s*[A-Z][A-Za-z'’\-\s]+$/.test(
      p,
    )
  ) {
    return true;
  }
  if (
    /^(Freshman|Sophomore|Junior|Senior|Graduate|Redshirt(?:\s+\w+)?)$/i.test(p)
  ) {
    return true;
  }
  return false;
}

function isCombineStatLine(p: string): boolean {
  if (!p) return false;
  return /^(Height(\s+without\s+shoes)?|Weight|Standing\s+reach|Wingspan|Body\s+fat|Vertical|Max\s+vert(?:ical)?|Lane\s+agility|Shuttle\s+run|Three[-\s]quarter\s+sprint|Hand\s+(length|width))\s*[:|]/i.test(
    p,
  );
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
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const rank = isRankLine(trimmed);
    const preStrip = rank
      ? trimmed
      : trimmed.replace(/^[#>*\-•·\d\.\)\s]+/, "").trim();
    if (!preStrip) continue;
    const p = stripTrailingCredit(preStrip);
    if (!p) continue;
    if (isNoiseLine(p)) continue;
    const structural =
      rank || isSectionHeader(p) || isPickInfoLine(p) || isCombineStatLine(p);
    if (!structural && p.length < MIN_PARAGRAPH_CHARS) continue;
    if (structural && p.length < 4) continue;
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

const APIFY_PAGE_FUNCTION = `async function pageFunction({ page }) {
  await page.waitForTimeout(3000);

  const fullText = await page.evaluate(() => {
    const body = document.body;
    if (!body) return "";
    return body.innerText || "";
  });

  await page.evaluate((text) => {
    const safe = String(text || "");
    const escapeHtml = (value) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    document.body.innerHTML =
      '<main id="afi-page-text"><pre style="white-space: pre-wrap;">' +
      escapeHtml(safe) +
      '</pre></main>';
  }, fullText);
}`;

async function callApify(
  targetUrl: string,
  requestedTitle: string,
  requestedDescription: string,
): Promise<ApifyItem | null> {
  const token = Deno.env.get("APIFY_TOKEN");
  if (!token) {
    console.error("APIFY_TOKEN not configured");
    return null;
  }
  const actorId = (
    Deno.env.get("APIFY_ACTOR_ID") ?? APIFY_DEFAULT_ACTOR
  ).trim();
  const safeActorId = actorId.replace("/", "~");

  console.log("news-article apify request:", {
    url: targetUrl,
    titleLen: requestedTitle.length,
    descriptionLen: requestedDescription.length,
  });

  const endpoint = `https://api.apify.com/v2/acts/${safeActorId}/run-sync-get-dataset-items?token=${encodeURIComponent(
    token,
  )}`;

  const body = {
    startUrls: [{ url: targetUrl }],
    crawlerType: "playwright:firefox",
    maxCrawlDepth: 0,
    maxCrawlPages: 1,
    maxResults: 1,
    requestTimeoutSecs: 30,
    maxRequestRetries: 2,
    maxSessionRotations: 3,
    dynamicContentWaitSecs: 3,
    maxScrollHeightPixels: 0,
    proxyConfiguration: { useApifyProxy: true },
    htmlTransformer: "none",
    saveMarkdown: true,
    saveHtml: false,
    saveFiles: false,
    saveScreenshots: false,
    removeCookieWarnings: true,
    expandIframes: false,
    clickElementsCssSelector: "",
    keepElementsCssSelector: "#afi-page-text",
    removeElementsCssSelector: "dummy_keep_everything",
    pageFunction: APIFY_PAGE_FUNCTION,
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

interface ExtractionOutcome {
  body: string;
  paragraphs: string[];
}

function buildArticleFromApify(
  apifyItem: ApifyItem,
  title: string,
  description: string,
): ExtractionOutcome | null {
  const candidates: string[] = [];
  const seen = new Set<string>();
  for (const raw of [
    apifyItem.markdown,
    apifyItem.text,
    apifyItem.content,
    apifyItem.pageContent,
  ]) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    candidates.push(raw);
  }
  if (candidates.length === 0) return null;

  for (const raw of candidates) {
    const outcome = tryExtractCandidate(raw, title, description);
    if (outcome) return outcome;
  }
  return null;
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
  const requestedTitle = (payload.title ?? "").trim();
  const requestedDescription = (payload.description ?? "").trim();
  const fallbackMeta: Partial<ArticleResponse> = {
    title: payload.title ?? null,
    image: payload.image ?? null,
    publishedAt: toIso(payload.publishedAt ?? null),
    source: payload.source ?? null,
  };

  if (isVideoUrl(url)) {
    return jsonResponse(
      emptyResponse(
        originalUrl,
        "video article body unavailable",
        fallbackMeta,
      ),
      200,
    );
  }

  if (!requestedTitle) {
    return jsonResponse(
      emptyResponse(
        originalUrl,
        "article body extraction did not match requested article",
        fallbackMeta,
      ),
      200,
    );
  }

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
      const sanitized = sanitizeCachedParagraphs(cached.body_paragraphs);
      const sanitizedBody = sanitized.paragraphs.join("\n\n");
      const cacheValidation = validateBodyBelongsToArticle(
        sanitized.paragraphs,
        requestedTitle,
        requestedDescription,
      );
      if (
        cacheValidation.valid &&
        sanitized.paragraphs.length >= MIN_PARAGRAPHS &&
        sanitizedBody.length >= MIN_BODY_CHARS
      ) {
        if (sanitized.changed) {
          await writeCache(client, {
            original_url: originalUrl,
            title: cached.title,
            description: cached.description,
            image_url: cached.image_url,
            source: cached.source,
            published_at: cached.published_at,
            body: sanitizedBody,
            body_paragraphs: sanitized.paragraphs,
            provider: cached.provider ?? "apify",
          });
        }
        const response: ArticleResponse = {
          title: cached.title ?? fallbackMeta.title ?? null,
          author: null,
          source: cached.source ?? fallbackMeta.source ?? null,
          publishedAt: cached.published_at ?? fallbackMeta.publishedAt ?? null,
          image: cached.image_url ?? fallbackMeta.image ?? null,
          body: sanitizedBody,
          bodyParagraphs: sanitized.paragraphs,
          originalUrl,
          provider: "cache",
          error: null,
        };
        return jsonResponse(response, 200);
      }
      console.error(
        "news-article cache invalid, purging:",
        cacheValidation.reason,
      );
      await deleteCacheRow(client, originalUrl);
    }
  }

  const apifyItem = await callApify(
    originalUrl,
    requestedTitle,
    requestedDescription,
  );
  if (!apifyItem) {
    return jsonResponse(
      emptyResponse(originalUrl, "extractor unavailable", fallbackMeta),
      200,
    );
  }

  const extracted = buildArticleFromApify(
    apifyItem,
    requestedTitle,
    requestedDescription,
  );
  if (!extracted) {
    return jsonResponse(
      emptyResponse(
        originalUrl,
        "article body extraction did not match requested article",
        fallbackMeta,
      ),
      200,
    );
  }

  const validation = validateBodyBelongsToArticle(
    extracted.paragraphs,
    requestedTitle,
    requestedDescription,
  );
  if (!validation.valid) {
    console.error(
      "news-article validation rejected fresh extraction:",
      validation.reason,
    );
    return jsonResponse(
      emptyResponse(
        originalUrl,
        "article body extraction did not match requested article",
        fallbackMeta,
      ),
      200,
    );
  }

  const finalParagraphs = validation.contentParagraphs;
  const finalBody = finalParagraphs.join("\n\n");

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
      body: finalBody,
      body_paragraphs: finalParagraphs,
      provider: "apify",
    });
  }

  const response: ArticleResponse = {
    title,
    author,
    source,
    publishedAt,
    image,
    body: finalBody,
    bodyParagraphs: finalParagraphs,
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
