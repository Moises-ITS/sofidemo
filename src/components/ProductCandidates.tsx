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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="kicker">Not quite right? Pick a match</div>
      {candidates.map((candidate, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={`${candidate.title}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`candidate-row ${
              selected ? "candidate-row--selected" : ""
            }`}
          >
            <span className="vault-icon">
              {candidate.imageUrl ? (
                <img
                  src={candidate.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                "🏷️"
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 13.5,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {candidate.title}
              </span>
              <span className="muted small">{candidate.retailer}</span>
            </span>
            <span
              className={selected ? "tone-cyan" : undefined}
              style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}
            >
              {formatMoney(candidate.price, candidate.currency)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
