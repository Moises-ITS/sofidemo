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
    <div className="animate-fade-up flex flex-col items-center gap-8">
      <div className="relative">
        <div className="animate-glow absolute -inset-4 rounded-[2rem] bg-violet-400/40 blur-2xl" />
        <div className="relative h-64 w-64 overflow-hidden rounded-3xl shadow-xl">
          <img
            src={imageUrl}
            alt="Item being analyzed"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent" />
          <div className="scan-beam absolute left-3 right-3 h-1 rounded-full bg-violet-300 shadow-[0_0_18px_4px_rgba(167,139,250,0.9)]" />
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {STAGES.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 text-base transition-colors ${
                done
                  ? "text-neutral-400"
                  : active
                    ? "font-semibold text-neutral-900"
                    : "text-neutral-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-emerald-100 text-emerald-600"
                    : active
                      ? "bg-violet-600 text-white"
                      : "bg-neutral-100 text-neutral-300"
                }`}
              >
                {done ? "✓" : active ? <Spinner /> : "•"}
              </span>
              {step.label}
              {active && <Ellipsis />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function Ellipsis() {
  return <span className="animate-pulse text-violet-500">…</span>;
}
