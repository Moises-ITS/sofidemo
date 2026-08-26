import { useEffect, useState } from "react";
import {
  ESPRESSO_VAULT_ID,
  INITIAL_VAULTS,
  PAYDAY_DEPOSIT,
  PRODUCT,
  formatMoney,
} from "./data";
import type { FundedChoice, Screen, Vault } from "./types";
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

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [vaults, setVaults] = useState<readonly Vault[]>(INITIAL_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
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

  const approvePlan = (topPriority: boolean) => {
    // Demo shortcut: the vault lands mid-journey so the detail screen has a story.
    setVaults((prev) => {
      const withEspresso = prev.some((v) => v.id === ESPRESSO_VAULT_ID)
        ? prev
        : [espressoTemplate(), ...prev];
      // Only one Vault holds the star: priority moves here when toggled on.
      return withEspresso.map((vault) =>
        vault.id === ESPRESSO_VAULT_ID
          ? { ...vault, priority: topPriority }
          : topPriority
            ? { ...vault, priority: false }
            : vault,
      );
    });
    setActiveVaultId(ESPRESSO_VAULT_ID);
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
        if (vault.id !== ESPRESSO_VAULT_ID || vault.status === "funded") {
          return vault;
        }
        const saved = Math.min(vault.goal, vault.saved + PAYDAY_DEPOSIT);
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
    setVaults((prev) => prev.filter((v) => v.id !== ESPRESSO_VAULT_ID));
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
        : `📈 ${formatMoney(PRODUCT.bestPrice)} moved to SoFi Invest`,
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
            onStartVault={() => setScreen("newVault")}
          />
        )}
        {screen === "newVault" && (
          <NewVaultPlan
            onBack={() => setScreen("capture")}
            onApprove={approvePlan}
            onManualAmount={() =>
              setToast("Demo: Smart Autosave picks the amount here")
            }
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
        {screen === "funded" && <Funded onChoose={resolveFundedChoice} />}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
