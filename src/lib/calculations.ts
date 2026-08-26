import type { LibraryItem } from "../types";

export interface LibraryStats {
  totalValue: number;
  totalItems: number;
  uniqueItems: number;
  averageValue: number;
  mostExpensive: LibraryItem | null;
}

export function calculateStats(items: readonly LibraryItem[]): LibraryStats {
  const totalValue = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const mostExpensive = items.reduce<LibraryItem | null>(
    (best, item) => (best === null || item.price > best.price ? item : best),
    null,
  );

  return {
    totalValue,
    totalItems,
    uniqueItems: items.length,
    averageValue: totalItems > 0 ? totalValue / totalItems : 0,
    mostExpensive,
  };
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
