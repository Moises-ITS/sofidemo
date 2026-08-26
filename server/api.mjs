// SoFi It demo — local dev API server.
// POST /api/recognize {image: <base64 jpeg>, media_type}
//   -> {label, emoji, best_price, sticker_price, retailers, source}
//
// Thin HTTP wrapper around server/recognize.mjs (the Vite dev proxy points
// here). In production on Vercel, api/recognize.js serves the same core.

import http from "node:http";
import { CLAUDE_MODEL, OPENAI_MODEL, PROVIDER, recognize } from "./recognize.mjs";

const PORT = Number(process.env.API_PORT || 8787);

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
  const vision =
    PROVIDER === "none"
      ? "NO KEY — recognition will fail (app falls back to demo product)"
      : PROVIDER === "openai"
        ? `openai (${OPENAI_MODEL})`
        : `claude (${CLAUDE_MODEL})`;
  console.log(
    `SoFi It api on http://localhost:${PORT}` +
      ` · vision ${vision}` +
      ` · serpapi ${process.env.SERPAPI_KEY ? "on" : "off (estimates)"}`,
  );
});
