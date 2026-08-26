import type { LibraryItem } from "../types";
import { formatMoney } from "../lib/calculations";

interface LibraryItemCardProps {
  item: LibraryItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function LibraryItemCard({
  item,
  onQuantityChange,
  onRemove,
}: LibraryItemCardProps) {
  return (
    <div className="animate-pop flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
      <img
        src={item.image}
        alt={item.name}
        className="h-16 w-16 shrink-0 rounded-xl bg-neutral-100 object-cover"
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-neutral-900">{item.name}</p>
        {item.retailer && (
          <p className="truncate text-xs text-neutral-400">{item.retailer}</p>
        )}
        <p className="mt-0.5 text-sm font-bold text-violet-700 tabular-nums">
          {formatMoney(item.price)}
          {item.quantity > 1 && (
            <span className="ml-1.5 font-medium text-neutral-400">
              × {item.quantity} = {formatMoney(item.price * item.quantity)}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => onRemove(item.id)}
          className="text-neutral-300 transition hover:text-red-500"
        >
          ✕
        </button>
        <div className="flex items-center gap-1 rounded-full border border-neutral-200 px-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            className="px-1.5 py-0.5 text-neutral-500 hover:text-violet-600"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="px-1.5 py-0.5 text-neutral-500 hover:text-violet-600"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
