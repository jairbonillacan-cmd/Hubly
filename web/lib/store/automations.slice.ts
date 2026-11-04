import type { StateCreator } from "zustand";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { AutomationRule } from "../types";

export interface AutomationsSlice {
  addAutomation: (rule: Pick<AutomationRule, "name" | "trigger" | "action" | "text">) => void;
  toggleAutomation: (ruleId: string) => void;
  removeAutomation: (ruleId: string) => void;
}

export const createAutomationsSlice: StateCreator<HublyStoreState, [], [], AutomationsSlice> = (set, get) => ({
  addAutomation: (rule) => {
    set((s) => ({
      automations: [
        { ...rule, id: `auto-${Date.now()}`, enabled: true, runs: 0 },
        ...(s.automations || []),
      ],
    }));
    persistWorkspaceState(get());
  },

  toggleAutomation: (ruleId) => {
    set((s) => ({
      automations: (s.automations || []).map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    }));
    persistWorkspaceState(get());
  },

  removeAutomation: (ruleId) => {
    set((s) => ({ automations: (s.automations || []).filter((r) => r.id !== ruleId) }));
    persistWorkspaceState(get());
  },
});
