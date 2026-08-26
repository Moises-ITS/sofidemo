import type { ProductSearchResult } from "../../shared/types.ts";

const MAX_CANDIDATES = 3;
const FETCH_TIMEOUT_MS = 12_000;

interface RawResult {
  title: string;
  price: number;
  currency: string;
  retailer: string;
  productUrl?: string;
  imageUrl?: string;
  originalPrice?: number;
}

export function isShoppingConfigured(): boolean {
  return Boolean(process.env.SERPAPI_API_KEY || process.env.SERPER_API_KEY);
}

/** Parses "$1,299.99" / "USD 399" style price strings into a number. */
function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Shopping API responded with HTTP ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function searchSerpApi(query: string, apiKey: string): Promise<RawResult[]> {
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
    gl: "us",
    hl: "en",
    num: "10",
  });
  const data = asRecord(await fetchJson(`https://serpapi.com/search.json?${params}`));
  const results = Array.isArray(data.shopping_results) ? data.shopping_results : [];

  return results.flatMap((entry): RawResult[] => {
    const item = asRecord(entry);
    const price = parsePrice(item.extracted_price ?? item.price);
    const title = typeof item.title === "string" ? item.title : null;
    if (!title || price === null || price <= 0) return [];
    return [
      {
        title,
        price,
        currency: "USD",
        retailer: typeof item.source === "string" ? item.source : "Online retailer",
        productUrl:
          typeof item.product_link === "string"
            ? item.product_link
            : typeof item.link === "string"
              ? item.link
              : undefined,
        imageUrl: typeof item.thumbnail === "string" ? item.thumbnail : undefined,
        originalPrice: parsePrice(item.extracted_old_price ?? item.old_price) ?? undefined,
      },
    ];
  });
}

async function searchSerper(query: string, apiKey: string): Promise<RawResult[]> {
  const data = asRecord(
    await fetchJson("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "us", hl: "en" }),
    }),
  );
  const results = Array.isArray(data.shopping) ? data.shopping : [];

  return results.flatMap((entry): RawResult[] => {
    const item = asRecord(entry);
    const price = parsePrice(item.price);
    const title = typeof item.title === "string" ? item.title : null;
    if (!title || price === null || price <= 0) return [];
    return [
      {
        title,
        price,
        currency: "USD",
        retailer: typeof item.source === "string" ? item.source : "Online retailer",
        productUrl: typeof item.link === "string" ? item.link : undefined,
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
      },
    ];
  });
}

/**
 * Simple relevance ranking: fraction of query tokens present in the title,
 * with a bonus when the whole query appears verbatim.
 */
function scoreResult(result: RawResult, query: string): number {
  const title = result.title.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => title.includes(token)).length;
  let score = hits / tokens.length;
  if (title.includes(query.toLowerCase())) score += 0.5;
  return score;
}

export async function searchProduct(query: string): Promise<ProductSearchResult[]> {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!serpApiKey && !serperKey) {
    throw new Error(
      "No shopping API configured (set SERPAPI_API_KEY or SERPER_API_KEY)",
    );
  }

  let results: RawResult[] = [];
  let lastError: unknown = null;

  if (serpApiKey) {
    try {
      results = await searchSerpApi(query, serpApiKey);
    } catch (error: unknown) {
      lastError = error;
      console.error("[shopping] SerpAPI search failed", error);
    }
  }
  if (results.length === 0 && serperKey) {
    try {
      results = await searchSerper(query, serperKey);
    } catch (error: unknown) {
      lastError = error;
      console.error("[shopping] Serper search failed", error);
    }
  }

  if (results.length === 0 && lastError) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Product search failed");
  }

  return [...results]
    .sort((a, b) => scoreResult(b, query) - scoreResult(a, query))
    .slice(0, MAX_CANDIDATES);
}
