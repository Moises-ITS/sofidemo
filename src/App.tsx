import { useEffect, useState } from "react";
import {
  ESPRESSO_PRODUCT,
  ESPRESSO_VAULT_ID,
  INITIAL_VAULTS,
  formatMoney,
  makeActivity,
} from "./data";
import type { FundedChoice, Product, Screen, Vault } from "./types";
import { VaultsHome } from "./screens/VaultsHome";
import { Capture } from "./screens/Capture";
import { NewVaultPlan } from "./screens/NewVaultPlan";
import { VaultDetail } from "./screens/VaultDetail";
import { Funded } from "./screens/Funded";

const TOAST_DURATION_MS = 3000;
const FUNDED_AUTO_ADVANCE_MS = 1100;

const espressoTemplate = (): Vault => {
  const template = INITIAL_VAULTS.find((v) => v.id === ESPRESSO_VAULT_ID);
  if (!template) throw new Error("Espresso vault missing from initial data");
  return template;
};

// Demo shortcut: new vaults land mid-journey so the detail screen has a story.
const vaultFromProduct = (product: Product, id: string): Vault => ({
  id,
  name: product.name,
  icon: product.emoji,
  saved: Math.round(product.bestPrice * 0.52),
  goal: product.bestPrice,
  perPayday: product.perPayday,
  subtitle: "On track",
  status: "active",
  activity: makeActivity(product),
});

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [vaults, setVaults] = useState<readonly Vault[]>(INITIAL_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product>(ESPRESSO_PRODUCT);
  const [toast, setToast] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  const activeVault = vaults.find((v) => v.id === activeVaultId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Once a vault the user is looking at becomes fully funded, glide to the fork.
  useEffect(() => {
    if (screen !== "detail" || autoAdvanced) return;
    if (activeVault?.status !== "funded") return;
    const timer = window.setTimeout(() => {
      setAutoAdvanced(true);
      setScreen("funded");
    }, FUNDED_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [screen, activeVault, autoAdvanced]);

  const openVault = (vaultId: string) => {
    setActiveVaultId(vaultId);
    setScreen("detail");
  };

  const startVault = (recognized: Product) => {
    setProduct(recognized);
    setScreen("newVault");
  };

  const approvePlan = (topPriority: boolean, perPayday: number) => {
    // The canned demo product reuses the espresso vault; a live-recognized
    // product gets a fresh vault of its own.
    const id = product.live ? `v-${Date.now()}` : ESPRESSO_VAULT_ID;
    setVaults((prev) => {
      const withVault = prev.some((v) => v.id === id)
        ? prev
        : [product.live ? vaultFromProduct(product, id) : espressoTemplate(), ...prev];
      // Only one Vault holds the star: priority moves here when toggled on.
      return withVault.map((vault) =>
        vault.id === id
          ? { ...vault, priority: topPriority, perPayday }
          : topPriority
            ? { ...vault, priority: false }
            : vault,
      );
    });
    setActiveVaultId(id);
    setAutoAdvanced(false);
    setScreen("detail");
    setToast(
      topPriority
        ? "★ Priority Vault created · saves first each payday"
        : "↻ Vault created · Smart Autosave armed",
    );
  };

  const simulatePayday = () => {
    setVaults((prev) =>
      prev.map((vault) => {
        if (vault.id !== activeVaultId || vault.status === "funded") {
          return vault;
        }
        // A touch above the plan ("income was up"), floored so big-ticket
        // goals still fund in a handful of demo taps.
        const deposit = Math.max(
          vault.perPayday + 7,
          Math.round(vault.goal * 0.08),
        );
        const saved = Math.min(vault.goal, vault.saved + deposit);
        const funded = saved >= vault.goal;
        return {
          ...vault,
          saved,
          status: funded ? "funded" : "active",
          activity: [
            {
              id: `sim-${Date.now()}`,
              icon: "↑",
              iconTone: "cyan" as const,
              title: `Payday: added ${formatMoney(saved - vault.saved)}`,
              detail: "Smart Autosave · just now",
            },
            ...vault.activity,
          ],
        };
      }),
    );
  };

  const resolveFundedChoice = (choice: FundedChoice) => {
    const amount = activeVault?.goal ?? 0;
    setVaults((prev) => prev.filter((v) => v.id !== activeVaultId));
    setActiveVaultId(null);
    setAutoAdvanced(false);
    if (choice === "next") {
      setScreen("capture");
      setToast("📷 Point it at the next want");
      return;
    }
    setScreen("home");
    setToast(
      choice === "buy"
        ? "🔒 Purchased with your single-use card"
        : `📈 ${formatMoney(amount)} moved to SoFi Invest`,
    );
  };

  return (
    <div className="stage">
      <div className="phone">
        {screen === "home" && (
          <VaultsHome
            vaults={vaults}
            onSofiIt={() => setScreen("capture")}
            onOpenVault={openVault}
          />
        )}
        {screen === "capture" && (
          <Capture
            onClose={() => setScreen("home")}
            onStartVault={startVault}
          />
        )}
        {screen === "newVault" && (
          <NewVaultPlan
            product={product}
            onBack={() => setScreen("capture")}
            onApprove={approvePlan}
          />
        )}
        {screen === "detail" && activeVault && (
          <VaultDetail
            vault={activeVault}
            onBack={() => setScreen("home")}
            onSimulatePayday={simulatePayday}
            onOpenFunded={() => setScreen("funded")}
          />
        )}
        {screen === "funded" && activeVault && (
          <Funded vault={activeVault} onChoose={resolveFundedChoice} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
