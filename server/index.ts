import "dotenv/config";
import express from "express";
import { analyzeRouter } from "./routes/analyze.ts";
import { searchProductRouter } from "./routes/searchProduct.ts";
import { isVisionConfigured } from "./services/vision.ts";
import { isShoppingConfigured } from "./services/shopping.ts";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    vision: isVisionConfigured() ? "openai" : "mock (set OPENAI_API_KEY)",
    shopping: isShoppingConfigured()
      ? "configured"
      : "not configured (set SERPAPI_API_KEY or SERPER_API_KEY)",
  });
});

app.use(analyzeRouter);
app.use(searchProductRouter);

// Final safety net so a thrown error never leaks a stack trace to the client.
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[server] unhandled error", error);
    res
      .status(500)
      .json({ success: false, data: null, error: "Something went wrong." });
  },
);

app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`);
  if (!isVisionConfigured()) {
    console.warn("[server] OPENAI_API_KEY missing — /api/analyze returns mock data");
  }
  if (!isShoppingConfigured()) {
    console.warn(
      "[server] No shopping API key — /api/search-product will fail (frontend falls back to demo products)",
    );
  }
});
