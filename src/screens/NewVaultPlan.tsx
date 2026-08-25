import { useEffect, useState } from "react";
import { HOW_IT_RUNS, PIPELINE_STEPS, PRODUCT, formatMoney } from "../data";

const STEP_INTERVAL_MS = 750;
const PLAN_REVEAL_DELAY_MS = 450;

interface NewVaultPlanProps {
  onBack: () => void;
  onApprove: () => void;
  onManualAmount: () => void;
}

export function NewVaultPlan({
  onBack,
  onApprove,
  onManualAmount,
}: NewVaultPlanProps) {
  // Number of pipeline steps completed; the step at this index is "running".
  const [doneCount, setDoneCount] = useState(0);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    if (doneCount < PIPELINE_STEPS.length) {
      const timer = window.setTimeout(
        () => setDoneCount((n) => n + 1),
        STEP_INTERVAL_MS,
      );
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () => setShowPlan(true),
      PLAN_REVEAL_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [doneCount]);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          ←
        </button>
        <div className="topbar-title" style={{ textAlign: "center" }}>
          New Vault
        </div>
        <span style={{ width: 34 }} />
      </div>

      {!showPlan ? (
        <>
          <div className="kicker" style={{ textAlign: "center", marginTop: 8 }}>
            Building your plan
          </div>
          <div className="card pipeline-list">
            {PIPELINE_STEPS.map((step, i) => {
              const state =
                i < doneCount ? "done" : i === doneCount ? "running" : "queued";
              return (
                <div key={step.id} className={`pipeline-step pipeline-step--${state}`}>
                  {state === "running" ? (
                    <div className="spinner" />
                  ) : (
                    <div className="pipeline-step__dot">
                      {state === "done" ? "✓" : "·"}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {step.label}
                    </div>
                    {state === "done" && (
                      <div className="small tone-green activity-enter">
                        {step.result}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="muted small" style={{ textAlign: "center" }}>
            Your agent is reading income, bills, and prices — nothing moves
            without your sign-off.
          </div>
        </>
      ) : (
        <>
          <div className="card card--raised">
            <div className="vault-row">
              <div className="vault-icon">☕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {PRODUCT.name}
                </div>
                <div className="muted small">
                  Best price · checked at {PRODUCT.retailers} retailers
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="tone-cyan" style={{ fontSize: 17, fontWeight: 800 }}>
                  {formatMoney(PRODUCT.bestPrice)}
                </div>
                <div className="strike">{formatMoney(PRODUCT.inStorePrice)}</div>
              </div>
            </div>
          </div>

          <div className="autosave-hero">
            <div className="pill pill--cyan">↻ Smart Autosave</div>
            <div className="autosave-hero__amount">
              {formatMoney(PRODUCT.perPayday)} <span>this payday</span>
            </div>
            <div className="muted small">
              Set from your income, bills, and your other Vaults
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              Goal {formatMoney(PRODUCT.bestPrice)} ·{" "}
              <span className="muted">Est. {PRODUCT.window}</span>
            </div>
          </div>

          <div className="kicker">How it runs</div>
          <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {HOW_IT_RUNS.map((rule) => (
              <div key={rule.text} className="rule-row">
                <div className="rule-row__icon">{rule.icon}</div>
                <span>{rule.text}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn--primary"
            style={{ marginTop: "auto" }}
            onClick={onApprove}
          >
            Approve plan
          </button>
          <button className="link-btn" onClick={onManualAmount}>
            Set the amount myself
          </button>
        </>
      )}
    </div>
  );
}
