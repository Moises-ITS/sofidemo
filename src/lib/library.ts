import type { LibraryItem } from "../types";

const STORAGE_KEY = "worthit.library.v1";

function isLibraryItem(value: unknown): value is LibraryItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number" &&
    typeof item.image === "string" &&
    typeof item.addedAt === "string"
  );
}

export function getLibrary(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLibraryItem);
  } catch {
    return [];
  }
}

function saveLibrary(items: readonly LibraryItem[]): LibraryItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error: unknown) {
    // Quota or private-mode failure: the in-memory state still works for the demo.
    console.error("Failed to persist library", error);
  }
  return [...items];
}

export function addLibraryItem(
  items: readonly LibraryItem[],
  item: LibraryItem,
): LibraryItem[] {
  return saveLibrary([item, ...items]);
}

export function removeLibraryItem(
  items: readonly LibraryItem[],
  id: string,
): LibraryItem[] {
  return saveLibrary(items.filter((item) => item.id !== id));
}

export function updateQuantity(
  items: readonly LibraryItem[],
  id: string,
  quantity: number,
): LibraryItem[] {
  if (quantity < 1) return removeLibraryItem(items, id);
  return saveLibrary(
    items.map((item) => (item.id === id ? { ...item, quantity } : item)),
  );
}

export function clearLibrary(): LibraryItem[] {
  return saveLibrary([]);
}

export function createLibraryItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
