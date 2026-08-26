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
  const displayName =
    identification.brand &&
    !identification.productName
      .toLowerCase()
      .includes(identification.brand.toLowerCase())
      ? `${identification.brand} ${identification.productName}`
      : identification.productName;
  const subtitle = [identification.variant, identification.color]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="kicker">Item identified</div>
        </div>
        <span className="pill pill--cyan">{confidencePct}% match</span>
      </div>

      <div className="card card--raised chip-in">
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div className="result-photo">
            <img
              src={displayImage}
              alt={selected.title}
              onError={(e) => {
                if (e.currentTarget.src !== photoUrl) {
                  e.currentTarget.src = photoUrl;
                }
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{displayName}</div>
            {subtitle && (
              <div className="muted small" style={{ marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>

          <div className="price-hero">
            <div className="kicker">Current price</div>
            <div className="price-hero__amount">
              {formatMoney(selected.price, selected.currency)}
            </div>
            {selected.originalPrice &&
              selected.originalPrice > selected.price && (
                <span className="strike">
                  {formatMoney(selected.originalPrice, selected.currency)}
                </span>
              )}
            <div className="muted small">
              {selected.retailer}
              {usedFallback && (
                <span className="pill pill--gold" style={{ marginLeft: 8 }}>
                  reference price
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductCandidates
        candidates={candidates}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />

      <button
        type="button"
        className="btn btn--primary btn--glow"
        onClick={() => onConfirm(selected)}
      >
        Add to Library
      </button>
      <button type="button" className="btn btn--ghost" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}
