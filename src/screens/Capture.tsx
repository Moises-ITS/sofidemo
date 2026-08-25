import { useEffect, useState } from "react";
import { PRODUCT, formatMoney } from "../data";
import { CoffeeMakerArt } from "../components/CoffeeMakerArt";

const RECOGNITION_DELAY_MS = 2200;

interface CaptureProps {
  onClose: () => void;
  onStartVault: () => void;
}

export function Capture({ onClose, onStartVault }: CaptureProps) {
  const [recognized, setRecognized] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setRecognized(true),
      RECOGNITION_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="screen capture-screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div className="topbar-title" style={{ textAlign: "center" }}>
          SoFi It
        </div>
        <button className="icon-btn" aria-label="Flash">
          ⚡
        </button>
      </div>

      <div className="capture-heading">
        <div className="kicker">Point it at a want</div>
      </div>

      <div className="viewfinder">
        <span className="viewfinder__corner viewfinder__corner--tl" />
        <span className="viewfinder__corner viewfinder__corner--tr" />
        <span className="viewfinder__corner viewfinder__corner--bl" />
        <span className="viewfinder__corner viewfinder__corner--br" />

        {!recognized && <div className="scan-line" />}
        <CoffeeMakerArt />

        {recognized && (
          <div className="product-chip">
            <div className="vault-icon" style={{ width: 34, height: 34 }}>
              🔍
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {PRODUCT.name}
              </div>
              <div className="muted small">
                Best price{" "}
                <span className="tone-cyan" style={{ fontWeight: 700 }}>
                  {formatMoney(PRODUCT.bestPrice)}
                </span>{" "}
                · {formatMoney(PRODUCT.inStorePrice)} in store
              </div>
            </div>
          </div>
        )}
      </div>

      {recognized ? (
        <button className="btn btn--primary" onClick={onStartVault}>
          Start a Vault
        </button>
      ) : (
        <button className="btn btn--ghost" disabled>
          Scanning…
        </button>
      )}
    </div>
  );
}
