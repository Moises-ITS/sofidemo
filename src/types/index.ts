export type {
  ProductIdentification,
  ProductSearchResult,
  ApiResponse,
  AnalyzeResponse,
  SearchProductResponse,
} from "../../shared/types";

export interface LibraryItem {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  price: number;
  quantity: number;
  /** Product image URL or a data URL of the user's photo. */
  image: string;
  retailer?: string;
  addedAt: string;
}

export type Page = "home" | "library";
