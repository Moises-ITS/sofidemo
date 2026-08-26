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
    <div className="card chip-in item-row">
      <span className="vault-icon">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          "🏷️"
        )}
      </span>

      <div className="item-row__body">
        <span className="item-row__name">{item.name}</span>
        {item.retailer && (
          <span className="muted small">{item.retailer}</span>
        )}
        <span
          className="tone-cyan"
          style={{ fontSize: 13.5, fontWeight: 700 }}
        >
          {formatMoney(item.price)}
          {item.quantity > 1 && (
            <span className="muted" style={{ fontWeight: 500 }}>
              {" "}
              × {item.quantity} = {formatMoney(item.price * item.quantity)}
            </span>
          )}
        </span>
      </div>

      <div className="item-row__side">
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          className="remove-btn"
          onClick={() => onRemove(item.id)}
        >
          ✕
        </button>
        <div className="qty-stepper">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
