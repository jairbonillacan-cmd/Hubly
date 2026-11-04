import type { StateCreator } from "zustand";
import { moveInList } from "../use-kanban-drag";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { Lead, LeadStage, Quote } from "../types";

export interface CrmSlice {
  saveLead: (lead: Omit<Lead, "id" | "createdAt"> & { id?: string }) => void;
  moveLead: (leadId: string, stage: LeadStage, beforeId: string | null) => void;
  deleteLead: (leadId: string) => void;
  saveQuote: (quote: Omit<Quote, "id" | "createdAt"> & { id?: string }) => void;
  deleteQuote: (quoteId: string) => void;
}

export const createCrmSlice: StateCreator<HublyStoreState, [], [], CrmSlice> = (set, get) => ({
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
});
