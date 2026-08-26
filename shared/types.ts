/**
 * Types shared between the frontend (src/) and the API server (server/).
 */

export interface ProductIdentification {
  brand: string | null;
  productName: string;
  model: string | null;
  variant: string | null;
  color: string | null;
  category: string | null;
  searchQuery: string;
  confidence: number;
}

export interface ProductSearchResult {
  title: string;
  price: number;
  currency: string;
  retailer: string;
  productUrl?: string;
  imageUrl?: string;
  originalPrice?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface AnalyzeRequest {
  /** Data URL (e.g. "data:image/jpeg;base64,...") of the photo to identify. */
  image: string;
}

export type AnalyzeResponse = ApiResponse<ProductIdentification>;

export interface SearchProductRequest {
  searchQuery: string;
}

export interface SearchProductData {
  /** Best matches first, at most 3. */
  candidates: ProductSearchResult[];
}

export type SearchProductResponse = ApiResponse<SearchProductData>;
