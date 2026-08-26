// Vercel serverless function: POST /api/recognize
// Same recognition core as the local dev server (server/api.mjs).
// Requires ANTHROPIC_API_KEY (and/or OPENAI_API_KEY) in the Vercel project's
// environment variables — there is no .env file in production.

import { recognize } from "../server/recognize.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(404).json({ error: "not found" });
  }
  try {
    const { image, media_type } = req.body ?? {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "missing image (base64)" });
    }
    const result = await recognize(image, media_type || "image/jpeg");
    console.log(
      `[recognize] ${result.emoji} ${result.label} · $${result.best_price} (${result.source})`,
    );
    res.status(200).json(result);
  } catch (err) {
    console.error("[recognize]", err?.message || err);
    res.status(502).json({ error: "recognition failed" });
  }
}
