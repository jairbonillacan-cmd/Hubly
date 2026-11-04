"use client";

import { create } from "zustand";
import { INITIAL_WORKSPACE_DATA } from "./seed-data";
import { createSessionSlice, type SessionSlice } from "./store/session.slice";
import { createUiSlice, type UiSlice } from "./store/ui.slice";
import { createCrmSlice, type CrmSlice } from "./store/crm.slice";
import { createAutomationsSlice, type AutomationsSlice } from "./store/automations.slice";
import { createAgentsSlice, type AgentsSlice } from "./store/agents.slice";
import { createNotebooksSlice, type NotebooksSlice } from "./store/notebooks.slice";
import { createAssetsSlice, type AssetsSlice } from "./store/assets.slice";
import { createProjectsSlice, type ProjectsSlice } from "./store/projects.slice";
import { createTasksSlice, type TasksSlice } from "./store/tasks.slice";
import { createTeamSlice, type TeamSlice } from "./store/team.slice";
import { createDashboardSlice, type DashboardSlice } from "./store/dashboard.slice";
import { createNotificationsSlice, type NotificationsSlice } from "./store/notifications.slice";
import { createBrandsSlice, type BrandsSlice } from "./store/brands.slice";
import { createBrandStrategySlice, type BrandStrategySlice } from "./store/brandStrategy.slice";
import { createPostsSlice, type PostsSlice } from "./store/posts.slice";
import { createChatSlice, type ChatSlice } from "./store/chat.slice";
import type { HublyWorkspaceData } from "./types";

/** Todo el estado: los datos guardados más lo que aporta cada slice. */
export type HublyStoreState = HublyWorkspaceData &
  SessionSlice &
  UiSlice &
  CrmSlice &
  AutomationsSlice &
  AgentsSlice &
  NotebooksSlice &
  AssetsSlice &
  ProjectsSlice &
  TasksSlice &
  TeamSlice &
  DashboardSlice &
  NotificationsSlice &
  BrandsSlice &
  BrandStrategySlice &
  PostsSlice &
  ChatSlice;

export const useHublyStore = create<HublyStoreState>()((...a) => ({
  ...INITIAL_WORKSPACE_DATA, // Siempre primero: aporta los datos guardados
  ...createSessionSlice(...a),
  ...createUiSlice(...a),
  ...createCrmSlice(...a),
  ...createAutomationsSlice(...a),
  ...createAgentsSlice(...a),
  ...createNotebooksSlice(...a),
  ...createAssetsSlice(...a),
  ...createProjectsSlice(...a),
  ...createTasksSlice(...a),
  ...createTeamSlice(...a),
  ...createDashboardSlice(...a),
  ...createNotificationsSlice(...a),
  ...createBrandsSlice(...a),
  ...createBrandStrategySlice(...a),
  ...createPostsSlice(...a),
  ...createChatSlice(...a),
}));

// Un lector puede navegar, pero ninguna acción cambia datos: el servidor rechazaría el
// guardado y la pantalla mostraría cambios que no existen.
const VIEWER_ACTIONS = new Set<string>([
  "setActiveBrand",
  "openComposer",
  "closeComposer",
  "setComposerDirty",
  "resolveComposerPending",
  "setCmdkOpen",
  "setAiDrawerOpen",
  "setAiDrawerPrompt",
  "setNewBrandModalOpen",
  "setInviteModalOpen",
  "setWidgetConfigModalOpen",
  "setAutoSuggestionsModalOpen",
  "setEditWidgetsMode",
  "setActiveNotebookId",
  "syncFromServer",
  "switchWorkspace",
]);

const guardedActions: Record<string, unknown> = {};
for (const [name, action] of Object.entries(useHublyStore.getState())) {
  if (typeof action !== "function" || VIEWER_ACTIONS.has(name)) continue;
  guardedActions[name] = (...args: unknown[]) => {
    if (useHublyStore.getState().role === "viewer") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hubly:save-state", { detail: "readonly" }));
      }
      return undefined;
    }
    return (action as (...a: unknown[]) => unknown)(...args);
  };
}
useHublyStore.setState(guardedActions as Partial<HublyStoreState>);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __hubly: typeof useHublyStore }).__hubly = useHublyStore;
}
