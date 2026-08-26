import type { ProductIdentification, ProductSearchResult } from "../types";

const REQUEST_TIMEOUT_MS = 45_000;

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; data?: T | null; error?: string | null }
      | null;

    if (!response.ok || !payload?.success || payload.data == null) {
      throw new ApiError(payload?.error ?? "The request failed. Please try again.");
    }
    return payload.data;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("That took too long. Please try again.");
    }
    throw new ApiError("We couldn't reach the server. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeImage(
  imageDataUrl: string,
): Promise<ProductIdentification> {
  return postJson<ProductIdentification>("/api/analyze", { image: imageDataUrl });
}

export async function searchProduct(
  searchQuery: string,
): Promise<ProductSearchResult[]> {
  const data = await postJson<{ candidates: ProductSearchResult[] }>(
    "/api/search-product",
    { searchQuery },
  );
  return data.candidates;
}
