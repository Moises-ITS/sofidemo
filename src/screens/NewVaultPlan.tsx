import { useEffect, useState } from "react";
import { HOW_IT_RUNS, formatMoney, makePipelineSteps } from "../data";
import type { Product } from "../types";

const STEP_INTERVAL_MS = 750;
const PLAN_REVEAL_DELAY_MS = 450;

const PRIORITY_RULE = {
  icon: "★",
  text: "This Vault saves first — Japan fund moves to #2",
};

interface NewVaultPlanProps {
  product: Product;
  onBack: () => void;
  onApprove: (topPriority: boolean) => void;
  onManualAmount: () => void;
}

export function NewVaultPlan({
  product,
  onBack,
  onApprove,
  onManualAmount,
}: NewVaultPlanProps) {
  // Number of pipeline steps completed; the step at this index is "running".
  const [doneCount, setDoneCount] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const [topPriority, setTopPriority] = useState(false);

  const steps = makePipelineSteps(product);

  // Priority reshuffles the plan: the last rule swaps depending on the toggle.
  const rules = topPriority
    ? HOW_IT_RUNS.map((rule) =>
        rule.text.includes("priority") ? PRIORITY_RULE : rule,
      )
    : HOW_IT_RUNS;

  useEffect(() => {
    if (doneCount < steps.length) {
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
  }, [doneCount, steps.length]);

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
            {steps.map((step, i) => {
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
              <div className="vault-icon">{product.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {product.name}
                </div>
                <div className="muted small">
                  {product.retailers > 0
                    ? `Best price · checked at ${product.retailers} retailers`
                    : "Best price · agent estimate"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="tone-cyan" style={{ fontSize: 17, fontWeight: 800 }}>
                  {formatMoney(product.bestPrice)}
                </div>
                <div className="strike">{formatMoney(product.inStorePrice)}</div>
              </div>
            </div>
          </div>

          <div className="autosave-hero">
            <div className="pill pill--cyan">↻ Smart Autosave</div>
            <div className="autosave-hero__amount">
              {formatMoney(product.perPayday)} <span>this payday</span>
            </div>
            <div className="muted small">
              Set from your income, bills, and your other Vaults
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              Goal {formatMoney(product.bestPrice)} ·{" "}
              <span className="muted">Est. {product.window}</span>
            </div>
          </div>

          <div className="kicker">How it runs</div>
          <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {rules.map((rule) => (
              <div key={rule.text} className="rule-row">
                <div className="rule-row__icon">{rule.icon}</div>
                <span>{rule.text}</span>
              </div>
            ))}
          </div>

          <button
            className={
              topPriority ? "priority-toggle priority-toggle--on" : "priority-toggle"
            }
            aria-pressed={topPriority}
            onClick={() => setTopPriority((on) => !on)}
          >
            <div className="priority-toggle__star">★</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Make it top priority
              </div>
              <div className="muted small">
                Saves first each payday, ahead of your other Vaults
              </div>
            </div>
            <span className={topPriority ? "pill pill--gold" : "pill pill--muted"}>
              {topPriority ? "On" : "Off"}
            </span>
          </button>

          <button
            className="btn btn--primary"
            style={{ marginTop: "auto" }}
            onClick={() => onApprove(topPriority)}
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
