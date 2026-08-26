// SoFi It demo — recognition API.
// POST /api/recognize {image: <base64 jpeg>, media_type}
//   -> {label, emoji, best_price, sticker_price, retailers, source}
//
// Claude identifies the product with structured outputs (grammar-constrained
// decoding against a JSON schema — the model can only emit valid JSON in this
// shape, so parsing never breaks). If SERPAPI_KEY is set, real retailer prices
// from Google Shopping replace Claude's estimate.

import http from "node:http";
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// Load ../.env without a dotenv dependency. Real env vars win.
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !m[1].startsWith("#") && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // no .env — rely on real env vars
}

const PORT = Number(process.env.API_PORT || 8787);
const MODEL = process.env.RECOGNIZE_MODEL || "claude-opus-5";

const client = new Anthropic();

const Recognition = z.object({
  label: z
    .string()
    .describe("Short shopper-friendly product name, e.g. 'Espresso machine'"),
  emoji: z.string().describe("Single emoji that best represents the product"),
  search_query: z
    .string()
    .describe(
      "What a shopper would type into Google Shopping to find this exact product (include brand/model if visible)",
    ),
  price: z
    .number()
    .describe("Best single estimate of typical US retail price, in dollars"),
  price_low: z.number().describe("Low end of the realistic retail range"),
  price_high: z.number().describe("High end of the realistic retail range"),
});

const PROMPT = `Identify the single most prominent purchasable product in this photo and estimate what it typically sells for at US retailers, in dollars. Use a short shopper-friendly label ("Espresso machine", "Trail running shoes") — include the brand or model in search_query if you can see one. If nothing clearly purchasable is visible, name the most goal-like thing you can see (a bike, a couch, a trip) and price that.`;

async function identify(image, media_type) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: zodOutputFormat(Recognition), effort: "low" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type, data: image },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("model refused to process the image");
  }
  return response.parsed_output;
}

// Optional deterministic pricing layer: real listings from Google Shopping.
// Any failure here falls back to Claude's estimate — it must never break recognition.
async function searchPrices(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.shopping_results ?? []).slice(0, 12);
    const prices = results
      .map((r) => r.extracted_price)
      .filter((p) => typeof p === "number" && p > 0)
      .sort((a, b) => a - b);
    if (prices.length < 2) return null;
    const best = Math.round(prices[0]);
    const median = Math.round(prices[Math.floor(prices.length / 2)]);
    const retailers = new Set(results.map((r) => r.source).filter(Boolean)).size;
    return {
      best,
      sticker: Math.max(median, Math.round(best * 1.05)),
      retailers: Math.max(retailers, 2),
    };
  } catch {
    return null;
  }
}

async function recognize(image, media_type) {
  const seen = await identify(image, media_type);
  const label = seen.label;
  const emoji = seen.emoji || "🛍️";
  const priced = await searchPrices(seen.search_query || label);
  if (priced) {
    return {
      label,
      emoji,
      best_price: priced.best,
      sticker_price: priced.sticker,
      retailers: priced.retailers,
      source: "live",
    };
  }
  const best = Math.max(1, Math.round(seen.price));
  return {
    label,
    emoji,
    best_price: best,
    sticker_price: Math.max(Math.round(seen.price_high), Math.round(best * 1.09)),
    retailers: 0,
    source: "estimate",
  };
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 8_000_000) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const server = http.createServer(async (req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST" || req.url !== "/api/recognize") {
    return json(404, { error: "not found" });
  }
  try {
    const { image, media_type } = JSON.parse((await readBody(req)) || "{}");
    if (!image || typeof image !== "string") {
      return json(400, { error: "missing image (base64)" });
    }
    const result = await recognize(image, media_type || "image/jpeg");
    console.log(
      `[recognize] ${result.emoji} ${result.label} · $${result.best_price} (${result.source})`,
    );
    json(200, result);
  } catch (err) {
    console.error("[recognize]", err?.message || err);
    json(502, { error: "recognition failed" });
  }
});

server.listen(PORT, () => {
  console.log(
    `SoFi It api on http://localhost:${PORT}` +
      ` · anthropic key ${process.env.ANTHROPIC_API_KEY ? "loaded" : "MISSING"}` +
      ` · serpapi ${process.env.SERPAPI_KEY ? "on" : "off (estimates)"}`,
  );
});
