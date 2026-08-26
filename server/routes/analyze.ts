import { Router } from "express";
import { z } from "zod";
import type { AnalyzeResponse } from "../../shared/types.ts";
import { identifyProduct } from "../services/vision.ts";

const requestSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/i, {
      message: "image must be a base64 image data URL",
    })
    .max(8_000_000, { message: "image is too large" }),
});

export const analyzeRouter = Router();

analyzeRouter.post("/api/analyze", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: AnalyzeResponse = {
      success: false,
      data: null,
      error: parsed.error.issues[0]?.message ?? "Invalid request",
    };
    res.status(400).json(response);
    return;
  }

  try {
    const identification = await identifyProduct(parsed.data.image);
    const response: AnalyzeResponse = {
      success: true,
      data: identification,
      error: null,
    };
    res.json(response);
  } catch (error: unknown) {
    console.error("[analyze] identification failed", error);
    const response: AnalyzeResponse = {
      success: false,
      data: null,
      error: "We couldn't analyze that photo. Please try again.",
    };
    res.status(502).json(response);
  }
});
