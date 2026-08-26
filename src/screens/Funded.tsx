import { useState } from "react";
import { formatMoney } from "../data";
import { Pill } from "../components/Pill";
import type { FundedChoice, Vault } from "../types";

interface ForkOption {
  choice: FundedChoice;
  icon: string;
  title: string;
  detail: string;
  featured?: boolean;
}

const forkOptions = (vault: Vault): readonly ForkOption[] => [
  {
    choice: "buy",
    icon: "🔒",
    title: "Buy it now",
    detail: `Single-use virtual card for exactly ${formatMoney(vault.goal)}`,
    featured: true,
  },
  {
    choice: "invest",
    icon: "📈",
    title: "Invest it instead",
    detail: `Move ${formatMoney(vault.goal)} to SoFi Invest`,
  },
  {
    choice: "next",
    icon: "📷",
    title: "Point it at the next thing",
    detail: "Start a new Vault with it",
  },
];

const confirmations = (
  vault: Vault,
): Record<FundedChoice, { title: string; detail: string }> => ({
  buy: {
    title: "Virtual card ready",
    detail: `A single-use card for exactly ${formatMoney(vault.goal)} is in your wallet. Go get that ${vault.name.toLowerCase()}.`,
  },
  invest: {
    title: `${formatMoney(vault.goal)} moved to SoFi Invest`,
    detail:
      "Delayed gratification, upgraded. It keeps working while you decide what's next.",
  },
  next: {
    title: "On to the next want",
    detail: `Your ${formatMoney(vault.goal)} rolls into whatever you point at next.`,
  },
});

interface FundedProps {
  vault: Vault;
  onChoose: (choice: FundedChoice) => void;
}

export function Funded({ vault, onChoose }: FundedProps) {
  const [confirmed, setConfirmed] = useState<FundedChoice | null>(null);

  if (confirmed) {
    const confirmation = confirmations(vault)[confirmed];
    return (
      <div className="screen">
        <div className="confirm-panel">
          <div className="confirm-panel__badge">✓</div>
          <div className="funded-headline" style={{ fontSize: 24 }}>
            {confirmation.title}
          </div>
          <div className="muted" style={{ fontSize: 14, maxWidth: 280 }}>
            {confirmation.detail}
          </div>
          <button
            className="btn btn--primary"
            style={{ maxWidth: 260, marginTop: 8 }}
            onClick={() => onChoose(confirmed)}
          >
            {confirmed === "next" ? "📷 SoFi It" : "Done"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="funded-banner">
        <Pill tone="green">✓ Fully funded</Pill>
        <span className="muted small">
          {formatMoney(vault.goal)} saved · payday by payday
        </span>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="funded-headline">
          It&rsquo;s here.
          <br />
          Still want it?
        </div>
        <div className="muted small" style={{ marginTop: 8 }}>
          No rush — it keeps earning APY until you decide.
        </div>
      </div>

      <div className="card card--raised">
        <div className="vault-row">
          <div className="vault-icon">{vault.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{vault.name}</div>
            <div className="muted small">
              Best price still {formatMoney(vault.goal)} · card ready
            </div>
          </div>
          <div className="tone-cyan" style={{ fontSize: 17, fontWeight: 800 }}>
            {formatMoney(vault.goal)}
          </div>
        </div>
      </div>

      {forkOptions(vault).map((option) => (
        <button
          key={option.choice}
          className={
            option.featured ? "fork-option fork-option--featured" : "fork-option"
          }
          onClick={() => setConfirmed(option.choice)}
        >
          <div className="fork-option__icon">{option.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{option.title}</div>
            <div className="muted small">{option.detail}</div>
          </div>
          <span className="fork-option__chevron">›</span>
        </button>
      ))}
    </div>
  );
}
