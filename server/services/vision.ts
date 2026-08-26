import OpenAI from "openai";
import { z } from "zod";
import type { ProductIdentification } from "../../shared/types.ts";

const identificationSchema = z.object({
  brand: z.string().nullable(),
  productName: z.string().min(1),
  model: z.string().nullable(),
  variant: z.string().nullable(),
  color: z.string().nullable(),
  category: z.string().nullable(),
  searchQuery: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    brand: { type: ["string", "null"] },
    productName: { type: "string" },
    model: { type: ["string", "null"] },
    variant: { type: ["string", "null"] },
    color: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    searchQuery: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "brand",
    "productName",
    "model",
    "variant",
    "color",
    "category",
    "searchQuery",
    "confidence",
  ],
} as const;

const SYSTEM_PROMPT = `You identify consumer products from photos for a price-lookup app.

Rules:
- Be as specific as possible: read visible logos, brand names, model names and model numbers.
- Use visible physical features (shape, ports, materials, colorway) to narrow the exact product.
- Do NOT hallucinate specifications that cannot reasonably be inferred from the image.
- Do NOT return or estimate any price. Pricing is handled by a separate system.
- confidence is your honest 0-1 estimate that the identification is the exact retail product.
- searchQuery must be a concise retail search query optimized to find this exact product
  (typically "Brand Model Variant", e.g. "Sony WH-1000XM5 Black Wireless Headphones").
- If the item is generic/unbranded, describe it plainly (e.g. "ceramic pour-over coffee dripper")
  and set brand/model to null with lower confidence.`;

/** Canned identification used when no OPENAI_API_KEY is configured (UI dev / dry runs). */
const MOCK_IDENTIFICATION: ProductIdentification = {
  brand: "Sony",
  productName: "Sony WH-1000XM5",
  model: "WH-1000XM5",
  variant: "Wireless Noise Cancelling Headphones",
  color: "Black",
  category: "Headphones",
  searchQuery: "Sony WH-1000XM5 Black Wireless Headphones",
  confidence: 0.95,
};

export function isVisionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function identifyProduct(
  imageDataUrl: string,
): Promise<ProductIdentification> {
  if (!isVisionConfigured()) {
    console.warn("[vision] OPENAI_API_KEY not set — returning mock identification");
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_IDENTIFICATION;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Identify the main consumer product in this photo.",
          },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "auto" } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "product_identification",
        strict: true,
        schema: JSON_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Vision model returned an empty response");
  }

  const parsed = identificationSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("[vision] invalid model output", parsed.error.flatten());
    throw new Error("Vision model returned malformed identification data");
  }

  return parsed.data;
}
