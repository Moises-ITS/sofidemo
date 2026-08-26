import { formatMoney } from "../data";
import type { Vault } from "../types";
import { Pill } from "../components/Pill";
import { ProgressBar } from "../components/ProgressBar";

interface VaultsHomeProps {
  vaults: readonly Vault[];
  onSofiIt: () => void;
  onOpenVault: (vaultId: string) => void;
}

export function VaultsHome({ vaults, onSofiIt, onOpenVault }: VaultsHomeProps) {
  const totalSaved = vaults.reduce((sum, v) => sum + v.saved, 0);
  const totalPerPayday = vaults.reduce((sum, v) => sum + v.perPayday, 0);

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="topbar-kicker">Checking &amp; Savings</div>
          <div className="topbar-title">Vaults</div>
        </div>
        <button className="icon-btn" aria-label="Notifications">
          🔔
        </button>
      </div>

      <div>
        <div className="home-total">{formatMoney(totalSaved)}</div>
        <div className="muted small">
          saved across {vaults.length} Vault{vaults.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="autosave-banner">
        <div className="autosave-banner__icon">↻</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>
            Smart Autosave
          </div>
          <div className="muted small">
            {formatMoney(totalPerPayday)} across {vaults.length} Vaults
          </div>
        </div>
      </div>

      <div className="kicker" style={{ marginTop: 6 }}>
        Your Vaults
      </div>

      {vaults.map((vault) => (
        <button
          key={vault.id}
          className="card card--tappable"
          onClick={() => onOpenVault(vault.id)}
        >
          <div className="vault-row">
            <div className="vault-icon">{vault.icon}</div>
            <div className="vault-row__body">
              <div className="vault-row__top">
                <span className="vault-row__name">
                  {vault.name}
                  {vault.priority && <span className="star">★</span>}
                </span>
                {vault.status === "funded" ? (
                  <Pill tone="green">✓ Funded</Pill>
                ) : (
                  <Pill tone="cyan">+${vault.perPayday}/payday</Pill>
                )}
              </div>
              <ProgressBar
                saved={vault.saved}
                goal={vault.goal}
                tone={vault.status === "funded" ? "green" : "cyan"}
              />
              <div className="muted small">
                {formatMoney(vault.saved)} of {formatMoney(vault.goal)} ·{" "}
                {vault.subtitle}
              </div>
            </div>
          </div>
        </button>
      ))}

      <button className="btn btn--primary sofi-it-btn" onClick={onSofiIt}>
        <span aria-hidden="true">📷</span> SoFi It
      </button>
    </div>
  );
}
