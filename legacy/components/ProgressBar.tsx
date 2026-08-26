interface ProgressBarProps {
  saved: number;
  goal: number;
  tone?: "cyan" | "green";
}

export function ProgressBar({ saved, goal, tone = "cyan" }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((saved / goal) * 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={
          tone === "green"
            ? "progress__fill progress__fill--green"
            : "progress__fill"
        }
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
