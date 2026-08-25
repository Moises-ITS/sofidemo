import { formatMoney } from "../data";
import type { Vault } from "../types";
import { Pill } from "../components/Pill";
import { ProgressBar } from "../components/ProgressBar";

interface VaultDetailProps {
  vault: Vault;
  onBack: () => void;
  onSimulatePayday: () => void;
  onOpenFunded: () => void;
}

export function VaultDetail({
  vault,
  onBack,
  onSimulatePayday,
  onOpenFunded,
}: VaultDetailProps) {
  const funded = vault.status === "funded";
  const pct = Math.min(100, Math.round((vault.saved / vault.goal) * 100));

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          ←
        </button>
        <div className="topbar-title" style={{ textAlign: "center" }}>
          {vault.name}
        </div>
        <button className="icon-btn" aria-label="More options">
          ⋯
        </button>
      </div>

      <div className="detail-hero">
        <span style={{ fontSize: 56 }} aria-hidden="true">
          {vault.icon}
        </span>
      </div>

      <div>
        <div className="detail-amount">
          {formatMoney(vault.saved)}{" "}
          <span>
            of {formatMoney(vault.goal)} · {pct}%
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar
            saved={vault.saved}
            goal={vault.goal}
            tone={funded ? "green" : "cyan"}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <span className="muted small">
            {funded ? "Fully funded — nice." : `${vault.subtitle} · a week ahead`}
          </span>
          <Pill tone="green">👁 Price watch on</Pill>
        </div>
      </div>

      {funded ? (
        <button className="btn btn--primary" onClick={onOpenFunded}>
          It&rsquo;s here — see your options
        </button>
      ) : (
        <button className="btn btn--ghost" onClick={onSimulatePayday}>
          ⏩ Simulate payday{" "}
          <span className="muted small">(demo)</span>
        </button>
      )}

      <div className="kicker" style={{ marginTop: 4 }}>
        Smart Autosave activity
      </div>

      {vault.activity.map((item, i) => (
        <div
          key={item.id}
          className={i === 0 ? "activity-row activity-enter" : "activity-row"}
        >
          <div className={`activity-row__icon tone-${item.iconTone}`}>
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
            <div className="muted small">{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
