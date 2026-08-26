import { useState } from "react";
import type { ProductIdentification, ProductSearchResult } from "../types";
import { formatMoney } from "../lib/calculations";
import { ProductCandidates } from "./ProductCandidates";

interface ProductResultProps {
  identification: ProductIdentification;
  candidates: readonly ProductSearchResult[];
  photoUrl: string;
  /** True when the shown price came from the built-in demo catalog. */
  usedFallback: boolean;
  onConfirm: (selected: ProductSearchResult) => void;
  onRetry: () => void;
}

export function ProductResult({
  identification,
  candidates,
  photoUrl,
  usedFallback,
  onConfirm,
  onRetry,
}: ProductResultProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = candidates[selectedIndex] ?? candidates[0];
  if (!selected) return null;

  const confidencePct = Math.round(identification.confidence * 100);
  const displayImage = selected.imageUrl ?? photoUrl;
  const subtitle = [identification.variant, identification.color]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="animate-fade-up mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5">
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3">
          <p className="text-xs font-bold tracking-[0.2em] text-white/90 uppercase">
            Item identified
          </p>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
            {confidencePct}% match
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-center rounded-2xl bg-neutral-50 p-4">
            <img
              src={displayImage}
              alt={selected.title}
              className="h-44 max-w-full rounded-xl object-contain"
              onError={(e) => {
                if (e.currentTarget.src !== photoUrl) {
                  e.currentTarget.src = photoUrl;
                }
              }}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {identification.brand &&
              !identification.productName
                .toLowerCase()
                .includes(identification.brand.toLowerCase())
                ? `${identification.brand} ${identification.productName}`
                : identification.productName}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
              Current price
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
                {formatMoney(selected.price, selected.currency)}
              </span>
              {selected.originalPrice && selected.originalPrice > selected.price && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatMoney(selected.originalPrice, selected.currency)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {selected.retailer}
              {usedFallback && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  reference price
                </span>
              )}
            </p>
          </div>

          <ProductCandidates
            candidates={candidates}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 font-semibold text-neutral-700 transition hover:border-neutral-300 active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selected)}
              className="flex-[1.4] rounded-2xl bg-violet-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
            >
              Add to Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
