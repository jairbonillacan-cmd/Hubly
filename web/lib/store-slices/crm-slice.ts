// Prospectos, cotizaciones y automatizaciones.
import type { StoreApi } from "zustand";
import { moveInList } from "../use-kanban-drag";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createCrmSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "saveLead"
  | "moveLead"
  | "deleteLead"
  | "saveQuote"
  | "deleteQuote"
  | "addAutomation"
  | "toggleAutomation"
  | "removeAutomation"
> => ({
  saveLead: (input) => {
    set((s) => {
      const leads = s.leads || [];
      if (input.id) {
        return { leads: leads.map((l) => (l.id === input.id ? { ...l, ...input, id: l.id } : l)) };
      }
      return {
        leads: [{ ...input, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() }, ...leads],
      };
    });
    persistWorkspaceState(get());
  },

  moveLead: (leadId, stage, beforeId) => {
    set((s) => ({ leads: moveInList(s.leads || [], leadId, beforeId, (l) => ({ ...l, stage })) }));
    persistWorkspaceState(get());
  },

  deleteLead: (leadId) => {
    set((s) => ({
      leads: (s.leads || []).filter((l) => l.id !== leadId),
      quotes: (s.quotes || []).filter((q) => q.leadId !== leadId),
    }));
    persistWorkspaceState(get());
  },

  saveQuote: (input) => {
    set((s) => {
      const quotes = s.quotes || [];
      if (input.id) {
        return { quotes: quotes.map((q) => (q.id === input.id ? { ...q, ...input, id: q.id } : q)) };
      }
      return {
        quotes: [{ ...input, id: `quote-${Date.now()}`, createdAt: new Date().toISOString() }, ...quotes],
      };
    });
    persistWorkspaceState(get());
  },

  deleteQuote: (quoteId) => {
    set((s) => ({ quotes: (s.quotes || []).filter((q) => q.id !== quoteId) }));
    persistWorkspaceState(get());
  },

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
