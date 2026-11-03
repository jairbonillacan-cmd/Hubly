// Marca activa y ventanas abiertas.
import type { StoreApi } from "zustand";
import { backendEnabled } from "../supabase/config";
import { currentAgencyId } from "../live-workspace";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createUiSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "setActiveBrand"
  | "openComposer"
  | "closeComposer"
  | "setComposerDirty"
  | "resolveComposerPending"
  | "setCmdkOpen"
  | "setAiDrawerOpen"
  | "setNewBrandModalOpen"
  | "setInviteModalOpen"
  | "setWidgetConfigModalOpen"
  | "setAutoSuggestionsModalOpen"
  | "setEditWidgetsMode"
  | "setActiveNotebookId"
> => ({
  setActiveBrand: (brandId) => {
    if (backendEnabled) {
      try {
        localStorage.setItem(`hubly:marca-activa:${currentAgencyId()}`, brandId);
      } catch {}
    }
    set((s) => {
      const exists = s.brands.some((b) => b.id === brandId);
      if (!exists) return s;
      return {
        activeBrandId: brandId,
      };
    });
    if (get().role !== "viewer") persistWorkspaceState(get());
  },

  openComposer: (postId = null, defaultDate = null) => {
    const state = get();
    if (state.composerOpen && state.composerDirty && postId !== state.editingPostId) {
      set({ composerPending: { postId, defaultDate }, cmdkOpen: false });
      return;
    }
    set({
      composerOpen: true,
      editingPostId: postId,
      composerDefaultDate: defaultDate,
      inviteModalOpen: false,
      newBrandModalOpen: false,
      cmdkOpen: false,
      widgetConfigModalOpen: false,
      autoSuggestionsModalOpen: false,
    });
  },
  closeComposer: () => set({ composerOpen: false, editingPostId: null, composerDirty: false, composerPending: null }),
  setComposerDirty: (dirty) => {
    if (get().composerDirty !== dirty) set({ composerDirty: dirty });
  },
  resolveComposerPending: (decision) => {
    const pending = get().composerPending;
    if (decision === "keep" || !pending) {
      set({ composerPending: null });
      return;
    }
    set({ composerOpen: true, editingPostId: pending.postId, composerDefaultDate: pending.defaultDate, composerDirty: false, composerPending: null });
  },
  setCmdkOpen: (open) => set({ cmdkOpen: open }),
  setAiDrawerOpen: (open) => set({ aiDrawerOpen: open }),
  setNewBrandModalOpen: (open) => set({ newBrandModalOpen: open }),
  setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
  setWidgetConfigModalOpen: (open) => set({ widgetConfigModalOpen: open }),
  setAutoSuggestionsModalOpen: (open) => set({ autoSuggestionsModalOpen: open }),
  setEditWidgetsMode: (enabled) => set({ editWidgetsMode: enabled }),
  setActiveNotebookId: (notebookId) => set({ activeNotebookId: notebookId }),
});
