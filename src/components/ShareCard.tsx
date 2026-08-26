import { useState } from "react";
import { formatMoney } from "../data";
import { ProgressBar } from "./ProgressBar";
import type { Vault } from "../types";

interface ShareCardProps {
  vault: Vault;
  onClose: () => void;
}

export function ShareCard({ vault, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const paydays = Math.max(1, Math.ceil(vault.goal / vault.perPayday));
  const shareText = `I SoFi'd it ${vault.icon} ${vault.name} — ${formatMoney(
    vault.goal,
  )} saved over ${paydays} paydays. $0 debt, 0% interest. Don't buy it. SoFi it.`;

  const share = async () => {
    // Native share sheet where the browser has one (phones); clipboard elsewhere.
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user closed the sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the card on screen is still the demo moment
    }
  };

  return (
    <div
      className="modal-overlay share-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Share your funded Vault"
    >
      <div className="share-card">
        <div className="share-card__brand">SoFi It</div>
        <div className="share-card__emoji" aria-hidden="true">
          {vault.icon}
        </div>
        <div className="share-card__headline">I SoFi&rsquo;d it.</div>
        <div className="share-card__product">{vault.name}</div>
        <div className="share-card__stats">
          {formatMoney(vault.goal)} saved · {paydays} paydays ·{" "}
          <span className="tone-green">$0 debt</span>
        </div>
        <div style={{ width: "100%" }}>
          <ProgressBar saved={vault.goal} goal={vault.goal} tone="green" />
        </div>
        <div className="share-card__tagline">Don&rsquo;t buy it. SoFi it.</div>
      </div>

      <button className="btn btn--primary" onClick={() => void share()}>
        {copied ? "✓ Copied — paste it anywhere" : "📤 Share it"}
      </button>
      <button className="link-btn" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
