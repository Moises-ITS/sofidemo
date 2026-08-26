import { Router } from "express";
import { z } from "zod";
import type { SearchProductResponse } from "../../shared/types.ts";
import { searchProduct } from "../services/shopping.ts";

const requestSchema = z.object({
  searchQuery: z.string().trim().min(2).max(300),
});

export const searchProductRouter = Router();

searchProductRouter.post("/api/search-product", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: SearchProductResponse = {
      success: false,
      data: null,
      error: "searchQuery must be a short text string",
    };
    res.status(400).json(response);
    return;
  }

  try {
    const candidates = await searchProduct(parsed.data.searchQuery);
    const response: SearchProductResponse = {
      success: true,
      data: { candidates },
      error: null,
    };
    res.json(response);
  } catch (error: unknown) {
    console.error("[search-product] search failed", error);
    const response: SearchProductResponse = {
      success: false,
      data: null,
      error: "Product search is unavailable right now.",
    };
    res.status(502).json(response);
  }
});
