import type { ProductIdentification, ProductSearchResult } from "../types";

/**
 * Known demo products used when live product search fails or returns nothing.
 * Add the items you plan to show judges here before the demo:
 * the key is matched (case-insensitively) against the AI identification.
 */
interface DemoFallback {
  name: string;
  price: number;
  retailer: string;
  imageUrl?: string;
}

export const demoFallbacks: Record<string, DemoFallback> = {
  "airpods max": {
    name: "Apple AirPods Max",
    price: 549,
    retailer: "Apple",
  },
  "airpods pro": {
    name: "Apple AirPods Pro (2nd Gen)",
    price: 249,
    retailer: "Apple",
  },
  "wh-1000xm5": {
    name: "Sony WH-1000XM5",
    price: 399.99,
    retailer: "Sony",
  },
  "nintendo switch oled": {
    name: "Nintendo Switch OLED",
    price: 349.99,
    retailer: "Nintendo",
  },
  "hydro flask": {
    name: "Hydro Flask 32 oz Wide Mouth",
    price: 44.95,
    retailer: "Hydro Flask",
  },
  "air force 1": {
    name: "Nike Air Force 1 '07",
    price: 115,
    retailer: "Nike",
  },
  "stanley quencher": {
    name: "Stanley Quencher H2.0 40 oz",
    price: 45,
    retailer: "Stanley",
  },
  "kindle paperwhite": {
    name: "Amazon Kindle Paperwhite",
    price: 159.99,
    retailer: "Amazon",
  },
};

/**
 * Finds a demo fallback matching the identification. Checks the search query,
 * product name, and brand+model against every fallback key.
 */
export function findDemoFallback(
  identification: ProductIdentification,
): ProductSearchResult | null {
  const haystacks = [
    identification.searchQuery,
    identification.productName,
    [identification.brand, identification.model].filter(Boolean).join(" "),
  ]
    .filter((s) => s.length > 0)
    .map((s) => s.toLowerCase());

  for (const [key, fallback] of Object.entries(demoFallbacks)) {
    if (haystacks.some((text) => text.includes(key))) {
      return {
        title: fallback.name,
        price: fallback.price,
        currency: "USD",
        retailer: fallback.retailer,
        imageUrl: fallback.imageUrl,
      };
    }
  }
  return null;
}
