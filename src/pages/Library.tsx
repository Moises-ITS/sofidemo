import type { LibraryItem } from "../types";
import { calculateStats } from "../lib/calculations";
import { LibrarySummary } from "../components/LibrarySummary";
import { LibraryItemCard } from "../components/LibraryItemCard";

interface LibraryProps {
  items: readonly LibraryItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onGoHome: () => void;
}

export function Library({
  items,
  onQuantityChange,
  onRemove,
  onClear,
  onGoHome,
}: LibraryProps) {
  const stats = calculateStats(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-3xl">
          📚
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">
            Your library is empty
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-neutral-500">
            Snap a photo of something you own and start building your
            collection&apos;s value.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-2xl bg-violet-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
        >
          📷 Add your first item
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
          My Library
        </h1>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove every item from your library?")) {
              onClear();
            }
          }}
          className="text-sm font-medium text-neutral-400 transition hover:text-red-500"
        >
          Clear all
        </button>
      </div>

      <LibrarySummary stats={stats} />

      <div className="flex flex-col gap-3 pb-8">
        {items.map((item) => (
          <LibraryItemCard
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
