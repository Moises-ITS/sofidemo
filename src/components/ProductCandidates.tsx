import type { ProductSearchResult } from "../types";
import { formatMoney } from "../lib/calculations";

interface ProductCandidatesProps {
  candidates: readonly ProductSearchResult[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ProductCandidates({
  candidates,
  selectedIndex,
  onSelect,
}: ProductCandidatesProps) {
  if (candidates.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
        Not quite right? Pick a match
      </p>
      {candidates.map((candidate, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={`${candidate.title}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
              selected
                ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                : "border-neutral-200 bg-white hover:border-violet-300"
            }`}
          >
            {candidate.imageUrl ? (
              <img
                src={candidate.imageUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg bg-neutral-100 object-contain"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-lg">
                🏷️
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-neutral-800">
                {candidate.title}
              </span>
              <span className="block text-xs text-neutral-400">
                {candidate.retailer}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-neutral-900">
              {formatMoney(candidate.price, candidate.currency)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
