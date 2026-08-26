import type { LibraryStats } from "../lib/calculations";
import { formatMoney } from "../lib/calculations";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

interface LibrarySummaryProps {
  stats: LibraryStats;
}

export function LibrarySummary({ stats }: LibrarySummaryProps) {
  const animatedTotal = useAnimatedNumber(stats.totalValue);

  return (
    <div className="summary-hero chip-in">
      <div>
        <div className="kicker">Total value</div>
        <div className="home-total" style={{ marginTop: 4 }}>
          {formatMoney(Math.round(animatedTotal * 100) / 100)}
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <span className="muted small">Items</span>
          <strong>{stats.totalItems}</strong>
        </div>
        <div>
          <span className="muted small">Avg. value</span>
          <strong>{formatMoney(stats.averageValue)}</strong>
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="muted small">Top item</span>
          <strong>
            {stats.mostExpensive ? stats.mostExpensive.name : "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}
