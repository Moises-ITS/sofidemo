// SoFi It demo — recognition core, shared by the local dev server
// (server/api.mjs) and the Vercel serverless function (api/recognize.js).
//
// A vision model identifies the product with schema-constrained JSON output
// (Claude structured outputs or OpenAI strict json_schema mode — either way
// the model can only emit valid JSON in this shape, so parsing never breaks).
// Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY; VISION_PROVIDER=claude|openai
// picks when both are set (default: claude). If SERPAPI_KEY is set, real
// retailer prices from Google Shopping replace the model's estimate.

import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// Load ../.env without a dotenv dependency (local dev only — on Vercel the
// file doesn't exist and env vars come from project settings). Real env wins.
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

export const CLAUDE_MODEL = process.env.RECOGNIZE_MODEL || "claude-opus-5";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Pick the vision provider: VISION_PROVIDER wins when its key exists,
// otherwise whichever key is configured (Claude first).
function resolveProvider() {
  const pref = (process.env.VISION_PROVIDER || "").toLowerCase();
  const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (pref === "claude" || pref === "openai") {
    if (pref === "claude" ? hasClaude : hasOpenAI) return pref;
    console.warn(
      `[vision] VISION_PROVIDER=${pref} but its API key is missing — auto-detecting instead`,
    );
  } else if (pref) {
    console.warn(`[vision] unknown VISION_PROVIDER "${pref}" (use claude or openai)`);
  }
  if (hasClaude) return "claude";
  if (hasOpenAI) return "openai";
  return "none";
}

export const PROVIDER = resolveProvider();

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

async function identifyClaude(image, media_type) {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
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

// Mirror of the zod schema above, for OpenAI's strict json_schema mode.
const RECOGNITION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: {
      type: "string",
      description: "Short shopper-friendly product name, e.g. 'Espresso machine'",
    },
    emoji: {
      type: "string",
      description: "Single emoji that best represents the product",
    },
    search_query: {
      type: "string",
      description:
        "What a shopper would type into Google Shopping to find this exact product (include brand/model if visible)",
    },
    price: {
      type: "number",
      description: "Best single estimate of typical US retail price, in dollars",
    },
    price_low: {
      type: "number",
      description: "Low end of the realistic retail range",
    },
    price_high: {
      type: "number",
      description: "High end of the realistic retail range",
    },
  },
  required: ["label", "emoji", "search_query", "price", "price_low", "price_high"],
};

async function identifyOpenAI(image, media_type) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${media_type};base64,${image}`, detail: "auto" },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "recognition",
        strict: true,
        schema: RECOGNITION_JSON_SCHEMA,
      },
    },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("vision model returned an empty response");
  }
  // Same zod validation as the Claude path, so downstream code sees one shape.
  return Recognition.parse(JSON.parse(raw));
}

async function identify(image, media_type) {
  return PROVIDER === "openai"
    ? identifyOpenAI(image, media_type)
    : identifyClaude(image, media_type);
}

// Optional deterministic pricing layer: real listings from Google Shopping.
// Any failure here falls back to the model's estimate — it must never break recognition.
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

export async function recognize(image, media_type) {
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
