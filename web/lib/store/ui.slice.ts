/*
 * Ventanas y modos de la interfaz: qué modal está abierto y qué está editando el
 * agente. Nada de esto se guarda en el documento.
 */
import type { StateCreator } from "zustand";
import type { HublyStoreState } from "../store";

export interface UiSlice {
  composerOpen: boolean;
  editingPostId: string | null;
  composerDefaultDate: string | null;
  /** El editor tiene cambios sin guardar: abrir otro post pide decidir antes. */
  composerDirty: boolean;
  composerPending: { postId: string | null; defaultDate: string | null } | null;
  cmdkOpen: boolean;
  aiDrawerOpen: boolean;
  aiDrawerPrompt: string | null;
  newBrandModalOpen: boolean;
  inviteModalOpen: boolean;
  widgetConfigModalOpen: boolean;
  autoSuggestionsModalOpen: boolean;
  editWidgetsMode: boolean;

  setComposerDirty: (dirty: boolean) => void;
  resolveComposerPending: (decision: "open" | "keep") => void;
  openComposer: (postId?: string | null, defaultDate?: string | null) => void;
  closeComposer: () => void;
  setCmdkOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;
  setAiDrawerPrompt: (prompt: string | null) => void;
  setNewBrandModalOpen: (open: boolean) => void;
  setInviteModalOpen: (open: boolean) => void;
  setWidgetConfigModalOpen: (open: boolean) => void;
  setAutoSuggestionsModalOpen: (open: boolean) => void;
  setEditWidgetsMode: (enabled: boolean) => void;
}

export const createUiSlice: StateCreator<HublyStoreState, [], [], UiSlice> = (set, get) => ({
  composerOpen: false,
  editingPostId: null,
  composerDefaultDate: null,
  composerDirty: false,
  composerPending: null,
  cmdkOpen: false,
  aiDrawerOpen: false,
  aiDrawerPrompt: null,
  newBrandModalOpen: false,
  inviteModalOpen: false,
  widgetConfigModalOpen: false,
  autoSuggestionsModalOpen: false,
  editWidgetsMode: false,

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
  setAiDrawerPrompt: (prompt) => set({ aiDrawerPrompt: prompt }),
  setNewBrandModalOpen: (open) => set({ newBrandModalOpen: open }),
  setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
  setWidgetConfigModalOpen: (open) => set({ widgetConfigModalOpen: open }),
  setAutoSuggestionsModalOpen: (open) => set({ autoSuggestionsModalOpen: open }),
  setEditWidgetsMode: (enabled) => set({ editWidgetsMode: enabled }),
});
