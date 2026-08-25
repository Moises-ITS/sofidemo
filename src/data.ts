import type { ActivityItem, PipelineStep, Vault } from "./types";

export const ESPRESSO_VAULT_ID = "espresso";
export const PAYDAY_DEPOSIT = 42;

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

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    id: "identify",
    label: "Identifying product from photo",
    result: "Espresso machine",
  },
  {
    id: "price",
    label: "Checking 4 retailers for best price",
    result: "$598 · $649 in store",
  },
  {
    id: "income",
    label: "Reading your income & deposit cadence",
    result: "Paid every Friday",
  },
  {
    id: "bills",
    label: "Checking bills & your other Vaults",
    result: "Japan fund keeps priority",
  },
  {
    id: "amount",
    label: "Setting your per-payday amount",
    result: "$35 this payday",
  },
];

export const HOW_IT_RUNS: readonly { icon: string; text: string }[] = [
  { icon: "↻", text: "Adjusts every payday with your income" },
  { icon: "⌃", text: "Never more than $60 a week" },
  { icon: "🛡", text: "Skips if Checking falls below $2,000" },
  { icon: "★", text: "Japan fund keeps priority" },
];

export const PRODUCT = {
  name: "Espresso machine",
  bestPrice: 598,
  inStorePrice: 649,
  retailers: 4,
  perPayday: 35,
  window: "Dec 21 – Jan 4",
} as const;

export const formatMoney = (n: number): string =>
  "$" + n.toLocaleString("en-US");
