import type { ActivityItem, PipelineStep, Product, Vault } from "./types";

export const ESPRESSO_VAULT_ID = "espresso";

export const formatMoney = (n: number): string =>
  "$" + n.toLocaleString("en-US");

/** Minimum-save floor: Smart Autosave never puts away less than this. */
export const MIN_PACE = 10;
/** Weekly cap — matches the "never more than $60 a week" rule. */
export const MAX_PACE = 60;

/**
 * Per-payday pace, scaled to the square root of price so small wants fund in
 * a payday or two and big wants spread out (~7 paydays at $100, ~18 at $600).
 * In $5 steps, clamped to the $10 floor and $60 weekly cap.
 */
export const suggestPace = (price: number): number => {
  const raw = Math.round(Math.sqrt(2 * Math.max(1, price)) / 5) * 5;
  return Math.min(MAX_PACE, Math.max(MIN_PACE, raw));
};

/** Estimated funding window, e.g. "Dec 21 – Jan 4". */
export const estWindow = (price: number, pace: number): string => {
  const weeks = Math.max(1, Math.ceil(price / pace));
  if (weeks <= 1) return "next payday";
  const day = 86_400_000;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(new Date(Date.now() + (weeks - 1) * 7 * day))} – ${fmt(
    new Date(Date.now() + (weeks + 1) * 7 * day),
  )}`;
};

/** Canned product for the no-camera / offline demo path. */
export const ESPRESSO_PRODUCT: Product = {
  name: "Espresso machine",
  emoji: "☕",
  bestPrice: 598,
  inStorePrice: 649,
  retailers: 4,
  perPayday: 35,
  window: "Dec 21 – Jan 4",
  live: false,
};

/** Shape returned by POST /api/recognize (see server/api.mjs). */
export interface RecognizeResponse {
  label: string;
  emoji: string;
  best_price: number;
  sticker_price: number;
  retailers: number;
  source: "live" | "estimate";
}

export const productFromApi = (r: RecognizeResponse): Product => {
  const best = Math.max(1, Math.round(r.best_price));
  const pace = suggestPace(best);
  return {
    name: r.label,
    emoji: r.emoji || "🛍️",
    bestPrice: best,
    inStorePrice: Math.max(Math.round(r.sticker_price) || 0, best + 10),
    retailers: r.retailers,
    perPayday: pace,
    window: estWindow(best, pace),
    live: true,
  };
};

/** Seed activity for a freshly created (mid-journey) Vault. */
export const makeActivity = (p: Product): readonly ActivityItem[] => [
  {
    id: "a1",
    icon: "↑",
    iconTone: "cyan",
    title: `Payday: added ${formatMoney(p.perPayday)}`,
    detail: "Smart Autosave · Fri",
  },
  {
    id: "a2",
    icon: "$",
    iconTone: "green",
    title: `Price watch: locked ${formatMoney(p.bestPrice)}`,
    detail:
      p.retailers > 0
        ? `Price checked at ${p.retailers} retailers · Tue`
        : "Agent estimate · Tue",
  },
  {
    id: "a3",
    icon: "⏸",
    iconTone: "muted",
    title: "Skipped a week — Checking dipped",
    detail: "Your $2,000 floor held · resumed payday",
  },
  {
    id: "a4",
    icon: "◎",
    iconTone: "cyan",
    title: "Roundups added $6.40 this week",
    detail: "From your debit card",
  },
];

export const ESPRESSO_ACTIVITY: readonly ActivityItem[] = [
  {
    id: "a1",
    icon: "↑",
    iconTone: "cyan",
    title: "Payday: added $42",
    detail: "Income was up this week · Fri",
  },
  {
    id: "a2",
    icon: "$",
    iconTone: "green",
    title: "Found it $51 under sticker — locked $598",
    detail: "Price checked at 4 retailers · Tue",
  },
  {
    id: "a3",
    icon: "⏸",
    iconTone: "muted",
    title: "Skipped a week — Checking dipped",
    detail: "Your $2,000 floor held · resumed payday",
  },
  {
    id: "a4",
    icon: "◎",
    iconTone: "cyan",
    title: "Roundups added $6.40 this week",
    detail: "From your debit card",
  },
  {
    id: "a5",
    icon: "🎁",
    iconTone: "gold",
    title: "Sam gifted $25 toward it",
    detail: "Shared Vault link · Sun",
  },
];

export const INITIAL_VAULTS: readonly Vault[] = [
  {
    id: ESPRESSO_VAULT_ID,
    name: "Espresso machine",
    icon: "☕",
    saved: 312,
    goal: 598,
    perPayday: 35,
    subtitle: "On track for Dec 21",
    status: "active",
    activity: ESPRESSO_ACTIVITY,
  },
  {
    id: "japan",
    name: "Japan 2027",
    icon: "✈️",
    saved: 1850,
    goal: 3200,
    perPayday: 45,
    subtitle: "Priority Vault",
    priority: true,
    status: "active",
    activity: [],
  },
  {
    id: "emergency",
    name: "Emergency fund",
    icon: "🛟",
    saved: 4120,
    goal: 6000,
    perPayday: 12,
    subtitle: "3 months of expenses",
    status: "active",
    activity: [],
  },
];

export const makePipelineSteps = (p: Product): readonly PipelineStep[] => [
  {
    id: "identify",
    label: "Identifying product from photo",
    result: p.name,
  },
  {
    id: "price",
    label:
      p.retailers > 0
        ? `Checking ${p.retailers} retailers for best price`
        : "Estimating the going price",
    result: formatMoney(p.bestPrice),
  },
  {
    id: "income",
    label: "Reading your income & deposit cadence",
    result: "Paid every Friday",
  },
  {
    id: "bills",
    label: "Checking bills & your other Vaults",
    result: "Your other Vaults stay on track",
  },
  {
    id: "amount",
    label: "Setting your per-payday amount",
    result: `${formatMoney(p.perPayday)} this payday`,
  },
];

export const HOW_IT_RUNS: readonly { icon: string; text: string }[] = [
  { icon: "↻", text: "Adjusts every payday with your income" },
  { icon: "⌃", text: "Never more than $60 a week" },
  { icon: "⌄", text: "At least $10 a payday — small wants fund fast" },
  { icon: "🛡", text: "Skips if Checking falls below $2,000" },
];
