import type { ReactNode } from "react";

interface PillProps {
  tone?: "cyan" | "green" | "muted";
  children: ReactNode;
}

export function Pill({ tone = "cyan", children }: PillProps) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}
