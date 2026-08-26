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
      <div className="screen">
        <div className="center-state">
          <div className="center-state__badge">📚</div>
          <div>
            <div className="capture-heading__title" style={{ fontSize: 20 }}>
              Your library is empty
            </div>
            <p className="muted small" style={{ marginTop: 8, maxWidth: 260 }}>
              Snap a photo of something you own and start building your
              collection&apos;s value.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--glow"
          onClick={onGoHome}
        >
          <span aria-hidden>📷</span> Add your first item
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="topbar-kicker">Your collection</div>
          <div className="topbar-title">My Library</div>
        </div>
        <button
          type="button"
          className="link-btn link-btn--danger"
          onClick={() => {
            if (window.confirm("Remove every item from your library?")) {
              onClear();
            }
          }}
        >
          Clear all
        </button>
      </div>

      <LibrarySummary stats={stats} />

      <div className="kicker" style={{ marginTop: 6 }}>
        Your items
      </div>

      {items.map((item) => (
        <LibraryItemCard
          key={item.id}
          item={item}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
