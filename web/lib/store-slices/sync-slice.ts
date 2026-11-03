// Carga, cambio de espacio, datos de referencia y reinicio de la demo.
import type { StoreApi } from "zustand";
import { createSeedWorkspaceData, rebaseStaleFixture, REFERENCE_FIXTURE_CLOCK } from "../seed-data";
import { backendEnabled } from "../supabase/config";
import { loadLiveWorkspace } from "../live-workspace";
import {
  buildReferenceFixtureWorkspace,
  clearWorkspaceStorage,
  fetchWorkspaceFromApi,
  hasStoredWorkspaceInV3,
  isReferenceFixtureUrl,
  loadWorkspaceFromStorage,
  normalizeWorkspacePayload,
  pushWorkspaceToApi,
  resolveTestClockFromUrl,
  resolveWorkspaceIdFromUrl,
  saveWorkspaceToStorage,
} from "../workspace-repository";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createSyncSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "syncFromServer"
  | "switchWorkspace"
  | "applyReferenceFixture"
  | "setTestClock"
  | "resetDemoData"
> => ({
  syncFromServer: async (workspaceIdOverride) => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }

    if (backendEnabled) {
      const loaded = await loadLiveWorkspace();
      if (loaded.kind === "ok") {
        // Onboarding interrumpido: sin marcas no hay pantalla que mostrar.
        if (loaded.data.brands.length === 0 && window.location.pathname !== "/onboarding") {
          window.location.assign("/onboarding");
          return;
        }
        // La marca activa es de cada persona, no de la agencia.
        let activeBrandId = loaded.data.activeBrandId;
        try {
          const saved = localStorage.getItem(`hubly:marca-activa:${loaded.agencyId}`);
          if (saved && loaded.data.brands.some((b) => b.id === saved)) activeBrandId = saved;
        } catch {}
        set({ ...loaded.data, activeBrandId, activeNotebookId: null, hydrated: true, role: loaded.role });
      } else if (loaded.kind === "unauthenticated") {
        window.location.assign("/login");
      } else if (loaded.kind === "no_agency") {
        if (window.location.pathname !== "/onboarding") window.location.assign("/onboarding");
        else set({ hydrated: true });
      } else {
        window.dispatchEvent(new CustomEvent("hubly:save-state", { detail: "error" }));
        set({ hydrated: true });
      }
      return;
    }

    const resolvedWorkspaceId = workspaceIdOverride || resolveWorkspaceIdFromUrl();
    const forceReferenceFixture = isReferenceFixtureUrl();
    const urlClock = resolveTestClockFromUrl();

    if (forceReferenceFixture) {
      const fixtureData = buildReferenceFixtureWorkspace(resolvedWorkspaceId);
      if (urlClock) {
        fixtureData.testClock = { fixedIsoNow: urlClock };
      }
      // Los datos de prueba viven solo en esta visita: no pisan el espacio demo guardado.
      set({
        ...fixtureData,
        activeNotebookId: null,
        hydrated: true,
      });
      return;
    }

    const hadLocalV3 = hasStoredWorkspaceInV3(resolvedWorkspaceId);
    const storedData = loadWorkspaceFromStorage(resolvedWorkspaceId);
    const localData = storedData
      ? rebaseStaleFixture(storedData)
      : createSeedWorkspaceData(resolvedWorkspaceId);
    if (storedData && localData !== storedData) {
      saveWorkspaceToStorage(resolvedWorkspaceId, localData);
      pushWorkspaceToApi(resolvedWorkspaceId, localData).catch(() => {});
    }

    if (urlClock) {
      localData.testClock = { fixedIsoNow: urlClock };
    }

    set({
      ...localData,
      activeNotebookId: null,
      hydrated: true,
    });

    if (!hadLocalV3) {
      const serverData = await fetchWorkspaceFromApi(resolvedWorkspaceId);
      if (serverData && Array.isArray(serverData.brands) && serverData.brands.length > 0) {
        const normalizedServer = rebaseStaleFixture(
          normalizeWorkspacePayload(serverData, resolvedWorkspaceId)
        );
        if (urlClock) {
          normalizedServer.testClock = { fixedIsoNow: urlClock };
        }
        saveWorkspaceToStorage(resolvedWorkspaceId, normalizedServer);
        set({
          ...normalizedServer,
          activeNotebookId: null,
          hydrated: true,
        });
        return;
      }
      saveWorkspaceToStorage(resolvedWorkspaceId, localData);
      pushWorkspaceToApi(resolvedWorkspaceId, localData).catch(() => {});
    }
  },

  switchWorkspace: async (workspaceId) => {
    const cleanId = workspaceId.trim() || "default";
    const storedWorkspace = loadWorkspaceFromStorage(cleanId);
    const loaded = storedWorkspace
      ? rebaseStaleFixture(storedWorkspace)
      : createSeedWorkspaceData(cleanId);
    set({
      ...loaded,
      workspaceId: cleanId,
      activeNotebookId: null,
      hydrated: true,
    });
    saveWorkspaceToStorage(cleanId, loaded);
  },

  applyReferenceFixture: () => {
    const wsId = get().workspaceId || "default";
    const fixture = buildReferenceFixtureWorkspace(wsId);
    set({
      ...fixture,
      activeNotebookId: null,
      hydrated: true,
    });
    saveWorkspaceToStorage(wsId, fixture);
    pushWorkspaceToApi(wsId, fixture).catch(() => {});
  },

  setTestClock: (fixedIsoNow) => {
    set({
      testClock: {
        fixedIsoNow: fixedIsoNow || REFERENCE_FIXTURE_CLOCK,
      },
    });
    persistWorkspaceState(get());
  },

  resetDemoData: (options) => {
    const currentWorkspaceId = get().workspaceId || "default";
    const useRef = options?.referenceFixture ?? isReferenceFixtureUrl();
    clearWorkspaceStorage(currentWorkspaceId);
    const freshData = createSeedWorkspaceData(currentWorkspaceId, {
      referenceFixture: useRef,
    });
    set({
      ...freshData,
      activeNotebookId: freshData.notebooks[0]?.id ?? null,
      hydrated: true,
    });
    saveWorkspaceToStorage(currentWorkspaceId, freshData);
    pushWorkspaceToApi(currentWorkspaceId, freshData).catch(() => {});
  },
});
