export type LoadingStage = "analyzing" | "identifying" | "searching";

const STAGES: readonly { id: LoadingStage; label: string }[] = [
  { id: "analyzing", label: "Analyzing photo" },
  { id: "identifying", label: "Identifying product" },
  { id: "searching", label: "Finding current price" },
];

interface AnalysisLoadingProps {
  stage: LoadingStage;
  imageUrl: string;
}

export function AnalysisLoading({ stage, imageUrl }: AnalysisLoadingProps) {
  const activeIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="screen">
      <div className="capture-heading">
        <div className="kicker">Scanning</div>
      </div>

      <div className="viewfinder">
        <img
          className="viewfinder__photo"
          src={imageUrl}
          alt="Item being analyzed"
        />
        <span className="viewfinder__corner viewfinder__corner--tl" />
        <span className="viewfinder__corner viewfinder__corner--tr" />
        <span className="viewfinder__corner viewfinder__corner--bl" />
        <span className="viewfinder__corner viewfinder__corner--br" />
        <div className="scan-line" />
      </div>

      <div className="card">
        <ul className="pipeline-list" style={{ listStyle: "none" }}>
          {STAGES.map((step, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            const stateClass = done
              ? "pipeline-step--done"
              : active
                ? "pipeline-step--running"
                : "";
            return (
              <li key={step.id} className={`pipeline-step ${stateClass}`}>
                {active ? (
                  <span className="spinner" />
                ) : (
                  <span className="pipeline-step__dot">{done ? "✓" : "•"}</span>
                )}
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>
                  {step.label}
                  {active && <span className="tone-cyan">…</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
