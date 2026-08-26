export type Screen = "home" | "capture" | "newVault" | "detail" | "funded";

export type VaultStatus = "active" | "funded";

export interface ActivityItem {
  id: string;
  icon: string;
  iconTone: "cyan" | "green" | "gold" | "muted";
  title: string;
  detail: string;
}

export interface Vault {
  id: string;
  name: string;
  icon: string;
  saved: number;
  goal: number;
  perPayday: number;
  subtitle: string;
  priority?: boolean;
  status: VaultStatus;
  activity: readonly ActivityItem[];
}

export interface Product {
  name: string;
  emoji: string;
  bestPrice: number;
  inStorePrice: number;
  /** Retailers price-checked; 0 = agent estimate only (no price API hit). */
  retailers: number;
  perPayday: number;
  window: string;
  /** true = came from real camera recognition; false = canned demo product. */
  live: boolean;
}

export interface PipelineStep {
  id: string;
  label: string;
  result: string;
}

export type FundedChoice = "buy" | "invest" | "next";
