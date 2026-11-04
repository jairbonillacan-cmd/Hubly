import type { StateCreator } from "zustand";
import { createAgent, duplicateAgent, isBlankAgent } from "../agents";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { HublyAgent } from "../types";

export interface AgentsSlice {
  addAgent: () => HublyAgent;
  updateAgent: (agentId: string, patch: Partial<HublyAgent>) => void;
  duplicateAgent: (agentId: string) => HublyAgent | undefined;
  deleteAgent: (agentId: string) => void;
}

export const createAgentsSlice: StateCreator<HublyStoreState, [], [], AgentsSlice> = (set, get) => ({
  addAgent: () => {
    const blank = (get().agents || []).find(isBlankAgent);
    if (blank) return blank;
    const created = createAgent();
    set((s) => ({ agents: [created, ...(s.agents || [])] }));
    persistWorkspaceState(get());
    return created;
  },

  updateAgent: (agentId, patch) => {
    set((s) => ({ agents: (s.agents || []).map((a) => (a.id === agentId ? { ...a, ...patch } : a)) }));
    persistWorkspaceState(get());
  },

  duplicateAgent: (agentId) => {
    const source = (get().agents || []).find((a) => a.id === agentId);
    if (!source) return undefined;
    const copy = duplicateAgent(source);
    set((s) => ({ agents: [copy, ...(s.agents || [])] }));
    persistWorkspaceState(get());
    return copy;
  },

  deleteAgent: (agentId) => {
    set((s) => ({ agents: (s.agents || []).filter((a) => a.id !== agentId) }));
    persistWorkspaceState(get());
  },
});
