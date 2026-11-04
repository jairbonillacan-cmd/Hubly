/*
 * Sesión, hidratación y espacio de trabajo. Mueve lo que había en `store.ts`
 * sin cambiar la lógica: quién entra, qué documento se carga y con qué reloj.
 */
import type { StateCreator } from "zustand";
import { startChatLive } from "../chat-live";
import { loadLiveWorkspace } from "../live-workspace";
import { createSeedWorkspaceData, rebaseStaleFixture, REFERENCE_FIXTURE_CLOCK } from "../seed-data";
import { backendEnabled } from "../supabase/config";
import {
  buildReferenceFixtureWorkspace,
  clearWorkspaceStorage,
  fetchWorkspaceFromApi,
  hasStoredWorkspaceInV3,
  isReferenceFixtureUrl,
  loadWorkspaceFromStorage,
  normalizeWorkspacePayload,
  pushWorkspaceToApi,
  rememberWorkspaceId,
  resolveActiveWorkspaceId,
  resolveTestClockFromUrl,
  saveWorkspaceToStorage,
} from "../workspace-repository";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { AgencyInfo, WorkspaceProfile } from "../types";

export interface SessionSlice {
  hydrated: boolean;
  /** Rol en la agencia con backend real; null en el modo demo. */
  role: string | null;
  isReferenceFixture: boolean;

  syncFromServer: (workspaceIdOverride?: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  applyReferenceFixture: () => void;
  setTestClock: (fixedIsoNow: string | null) => void;
  resetDemoData: (options?: { referenceFixture?: boolean }) => void;
  updateProfile: (patch: Partial<WorkspaceProfile>) => void;
  updateAgency: (patch: Partial<AgencyInfo>) => void;
}

export const createSessionSlice: StateCreator<HublyStoreState, [], [], SessionSlice> = (set, get) => ({
  hydrated: false,
  role: null,
  isReferenceFixture: false,

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
        } catch { /* Almacenamiento lleno o bloqueado: se sigue sin él. */ }
        set({ ...loaded.data, activeBrandId, activeNotebookId: null, hydrated: true, role: loaded.role });
        void startChatLive({ agencyId: loaded.agencyId, get: () => get(), set: (patch) => set((s) => patch(s) as Partial<HublyStoreState>) });
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

    const resolvedWorkspaceId = workspaceIdOverride || resolveActiveWorkspaceId();
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
    // Con cuentas reales, cargar un espacio de ejemplo acabaría guardado sobre la agencia.
    if (backendEnabled) return;
    const cleanId = workspaceId.trim() || "default";
    rememberWorkspaceId(cleanId);
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

  updateProfile: (patch) => {
    if (backendEnabled && patch.name) {
      const name = patch.name;
      void import("../supabase/browser").then(({ createSupabaseBrowser }) =>
        createSupabaseBrowser().auth.updateUser({ data: { name } })
      );
    }
    set((s) => {
      const nextName = patch.name ?? s.profile.name;
      const nextRole = patch.role ?? s.profile.role;
      const nextAvatarInitial =
        patch.avatarInitial ??
        nextName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("");
      const resolvedInitial = nextAvatarInitial || s.profile.avatarInitial;
      const nextTeam = s.team.map((m, idx) =>
        m.id === "tm-1" || idx === 0
          ? {
              ...m,
              name: nextName,
              role: nextRole,
              initials: resolvedInitial,
              avatarInitial: resolvedInitial.slice(0, 1) || "J",
            }
          : m
      );
      return {
        profile: {
          ...s.profile,
          ...patch,
          name: nextName,
          role: nextRole,
          avatarInitial: resolvedInitial,
        },
        team: nextTeam,
        teamMembers: nextTeam,
      };
    });
    persistWorkspaceState(get());
  },

  updateAgency: (patch) => {
    set((s) => {
      const nextAgency = { ...s.agency, ...patch };
      return {
        agency: nextAgency,
        agencyName: nextAgency.name,
      };
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
