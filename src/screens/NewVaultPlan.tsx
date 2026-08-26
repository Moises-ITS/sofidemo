import { useEffect, useState } from "react";
import {
  HOW_IT_RUNS,
  MAX_PACE,
  MIN_PACE,
  estWindow,
  formatMoney,
  makePipelineSteps,
} from "../data";
import type { Product } from "../types";

const STEP_INTERVAL_MS = 750;
const PLAN_REVEAL_DELAY_MS = 450;
const PACE_STEP = 5;

const PRIORITY_RULE = {
  icon: "★",
  text: "This Vault saves first — others move down one",
};

interface NewVaultPlanProps {
  product: Product;
  onBack: () => void;
  onApprove: (topPriority: boolean, perPayday: number) => void;
}

export function NewVaultPlan({ product, onBack, onApprove }: NewVaultPlanProps) {
  // Number of pipeline steps completed; the step at this index is "running".
  const [doneCount, setDoneCount] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const [topPriority, setTopPriority] = useState(false);
  const [pace, setPace] = useState(product.perPayday);
  const [amountModal, setAmountModal] = useState(false);
  const [draftPace, setDraftPace] = useState(product.perPayday);

  const steps = makePipelineSteps(product);
  const window_ =
    pace === product.perPayday
      ? product.window
      : estWindow(product.bestPrice, pace);

  // Priority reshuffles the plan: an extra rule appears when the toggle is on.
  const rules = topPriority ? [...HOW_IT_RUNS, PRIORITY_RULE] : HOW_IT_RUNS;

  const nudgeDraft = (direction: 1 | -1) =>
    setDraftPace((n) =>
      Math.min(MAX_PACE, Math.max(MIN_PACE, n + direction * PACE_STEP)),
    );

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
              <div className="tone-cyan" style={{ fontSize: 17, fontWeight: 800 }}>
                {formatMoney(product.bestPrice)}
              </div>
            </div>
          </div>

          <div className="autosave-hero">
            <div className="pill pill--cyan">↻ Smart Autosave</div>
            <div className="autosave-hero__amount">
              {formatMoney(pace)} <span>this payday</span>
            </div>
            <div className="muted small">
              {product.bestPrice <= MIN_PACE
                ? `Below your ${formatMoney(MIN_PACE)} minimum save — funds in one payday`
                : pace === product.perPayday
                  ? "Set from your income, bills, and your other Vaults"
                  : "Set by you — Smart Autosave adjusts around it"}
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              Goal {formatMoney(product.bestPrice)} ·{" "}
              <span className="muted">Est. {window_}</span>
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
            onClick={() => onApprove(topPriority, pace)}
          >
            Approve plan
          </button>
          <button
            className="link-btn"
            onClick={() => {
              setDraftPace(pace);
              setAmountModal(true);
            }}
          >
            Set the amount myself
          </button>
        </>
      )}

      {amountModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Set your per-payday amount"
        >
          <div className="modal">
            <div style={{ fontSize: 16, fontWeight: 800 }}>Set your amount</div>
            <div className="muted small" style={{ marginTop: 4 }}>
              Smart Autosave adjusts around whatever you pick — your $2,000
              Checking floor still applies.
            </div>

            <div className="amount-stepper">
              <button
                className="amount-stepper__btn"
                aria-label="Decrease amount"
                disabled={draftPace <= MIN_PACE}
                onClick={() => nudgeDraft(-1)}
              >
                −
              </button>
              <div className="amount-stepper__value">
                {formatMoney(draftPace)}
                <span>per payday</span>
              </div>
              <button
                className="amount-stepper__btn"
                aria-label="Increase amount"
                disabled={draftPace >= MAX_PACE}
                onClick={() => nudgeDraft(1)}
              >
                +
              </button>
            </div>

            <div className="muted small" style={{ textAlign: "center" }}>
              Est. funded{" "}
              {estWindow(product.bestPrice, draftPace)}
            </div>

            <button
              className="btn btn--primary"
              style={{ marginTop: 14 }}
              onClick={() => {
                setPace(draftPace);
                setAmountModal(false);
              }}
            >
              Use {formatMoney(draftPace)} per payday
            </button>
            <button className="link-btn" onClick={() => setAmountModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
