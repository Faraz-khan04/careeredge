"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SkillArbitrageResult, RemotePayEquityResult } from "@/types";
import type { SkillArbitrageInput, RemotePayEquityInput } from "@/lib/schemas";

export type CalculationKind = "SKILL_ARBITRAGE" | "REMOTE_PAY_EQUITY";

export interface StoredRun {
  id: string;
  kind: CalculationKind;
  createdAt: string;
  input: SkillArbitrageInput | RemotePayEquityInput;
  result: SkillArbitrageResult | RemotePayEquityResult;
  /** Set once the run has been persisted server-side and can be embedded. */
  serverId?: string;
}

interface CalculatorState {
  runs: StoredRun[];
  /** Assets the visitor has already traded an email for. */
  unlockedAssets: string[];
  isPro: boolean;

  recordRun: (run: Omit<StoredRun, "id" | "createdAt">) => StoredRun;
  attachServerId: (localId: string, serverId: string) => void;
  latestRun: (kind: CalculationKind) => StoredRun | undefined;
  runById: (id: string) => StoredRun | undefined;
  unlockAsset: (asset: string) => void;
  hasUnlocked: (asset: string) => boolean;
  setPro: (value: boolean) => void;
  clear: () => void;
}

function makeId(): string {
  return `run_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      runs: [],
      unlockedAssets: [],
      isPro: false,

      recordRun: (run) => {
        const stored: StoredRun = { ...run, id: makeId(), createdAt: new Date().toISOString() };
        // Keep the last 20 runs — enough for the "your calculations" picker
        // without turning localStorage into an archive.
        set((s) => ({ runs: [stored, ...s.runs].slice(0, 20) }));
        return stored;
      },

      attachServerId: (localId, serverId) =>
        set((s) => ({
          runs: s.runs.map((r) => (r.id === localId ? { ...r, serverId } : r)),
        })),

      latestRun: (kind) => get().runs.find((r) => r.kind === kind),
      runById: (id) => get().runs.find((r) => r.id === id),

      unlockAsset: (asset) =>
        set((s) =>
          s.unlockedAssets.includes(asset)
            ? s
            : { unlockedAssets: [...s.unlockedAssets, asset] },
        ),

      hasUnlocked: (asset) => get().unlockedAssets.includes(asset),
      setPro: (value) => set({ isPro: value }),
      clear: () => set({ runs: [], unlockedAssets: [] }),
    }),
    {
      name: "careeredge:calculations",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ runs: s.runs, unlockedAssets: s.unlockedAssets, isPro: s.isPro }),
    },
  ),
);
