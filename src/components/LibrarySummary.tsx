import type { LibraryStats } from "../lib/calculations";
import { formatMoney } from "../lib/calculations";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

interface LibrarySummaryProps {
  stats: LibraryStats;
}

export function LibrarySummary({ stats }: LibrarySummaryProps) {
  const animatedTotal = useAnimatedNumber(stats.totalValue);

  return (
    <div className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-indigo-900/20">
      <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
        Total value
      </p>
      <p className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums">
        {formatMoney(Math.round(animatedTotal * 100) / 100)}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-sm">
        <div>
          <p className="text-white/60">Items</p>
          <p className="font-bold tabular-nums">{stats.totalItems}</p>
        </div>
        <div>
          <p className="text-white/60">Avg. value</p>
          <p className="font-bold tabular-nums">{formatMoney(stats.averageValue)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-white/60">Top item</p>
          <p className="truncate font-bold">
            {stats.mostExpensive ? stats.mostExpensive.name : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
