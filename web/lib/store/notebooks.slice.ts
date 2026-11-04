import type { StateCreator } from "zustand";
import { createActivityItem } from "../domain/activity";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { NotebookItem } from "../types";

export interface NotebooksSlice {
  activeNotebookId: string | null;
  setActiveNotebookId: (notebookId: string | null) => void;
  addNotebook: (input: {
    title: string;
    subtitle?: string;
    category?: string;
    content?: string;
    brandId?: string;
    accentColor?: string;
    isPinned?: boolean;
  }) => NotebookItem;
  updateNotebook: (
    notebookId: string,
    patch: Partial<
      Pick<
        NotebookItem,
        | "title"
        | "subtitle"
        | "category"
        | "content"
        | "brandId"
        | "accentColor"
        | "isPinned"
      >
    >
  ) => void;
  deleteNotebook: (notebookId: string) => void;
  toggleNotebookPinned: (notebookId: string) => void;
}

export const createNotebooksSlice: StateCreator<HublyStoreState, [], [], NotebooksSlice> = (set, get) => ({
  activeNotebookId: null,
  setActiveNotebookId: (notebookId) => set({ activeNotebookId: notebookId }),

  addNotebook: (input) => {
    const nowIso = new Date().toISOString();
    const count = get().notebooks.length + 1;
    const stampLabel = `N° ${String(count).padStart(2, "0")} · OCT 26`;
    const created: NotebookItem = {
      id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      brandId: input.brandId || get().activeBrandId || "brand-min",
      title: (input.title.trim() || "NUEVA LIBRETA").toUpperCase(),
      subtitle: input.subtitle || stampLabel,
      stamp: stampLabel,
      variant: "space",
      category: input.category || "Notas de marca",
      content: input.content ?? "",
      bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
      accentColor: input.accentColor || "#10B981",
      updatedAt: nowIso,
      updatedBy: get().profile.name || "Jair",
      isPinned: input.isPinned ?? false,
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "notebook_updated",
        brandId: created.brandId,
        durationMinutes: 10,
        metadata: { notebookId: created.id, title: created.title },
      });
      return {
        notebooks: [created, ...s.notebooks],
        activeNotebookId: created.id,
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
    return created;
  },

  updateNotebook: (notebookId, patch) => {
    const nowIso = new Date().toISOString();
    set((s) => ({
      notebooks: s.notebooks.map((nb) =>
        nb.id === notebookId
          ? {
              ...nb,
              ...patch,
              updatedAt: nowIso,
            }
          : nb
      ),
    }));
    persistWorkspaceState(get());
  },

  deleteNotebook: (notebookId) => {
    set((s) => {
      const remaining = s.notebooks.filter((nb) => nb.id !== notebookId);
      return {
        notebooks: remaining,
        activeNotebookId:
          s.activeNotebookId === notebookId ? remaining[0]?.id ?? null : s.activeNotebookId,
      };
    });
    persistWorkspaceState(get());
  },

  toggleNotebookPinned: (notebookId) => {
    set((s) => ({
      notebooks: s.notebooks.map((nb) =>
        nb.id === notebookId
          ? { ...nb, isPinned: !nb.isPinned, updatedAt: new Date().toISOString() }
          : nb
      ),
    }));
    persistWorkspaceState(get());
  },
});
