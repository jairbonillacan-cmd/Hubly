/*
 * Qué se guarda del store y cómo. Vive fuera de `store.ts` porque casi todas las
 * acciones de todos los dominios lo necesitan, y un slice no importa otro slice.
 */
import { CHAT_NOTIFICATION_PREFIX, chatRemote } from "../chat-live";
import { queueLiveSave } from "../live-workspace";
import { isReferenceFixtureUrl, pushWorkspaceToApi, saveWorkspaceToStorage } from "../workspace-repository";
import { backendEnabled } from "../supabase/config";
import type { HublyStoreState } from "../store";
import type { HublyWorkspaceData } from "../types";

function extractWorkspaceData(state: HublyStoreState): HublyWorkspaceData {
  return {
    schemaVersion: 2,
    workspaceId: state.workspaceId || "default",
    agencyName: state.agencyName,
    profile: state.profile,
    agency: state.agency,
    testClock: state.testClock,
    activeBrandId: state.activeBrandId,
    brands: state.brands,
    posts: state.posts,
    ideas: state.ideas,
    leads: state.leads,
    quotes: state.quotes,
    automations: state.automations,
    agents: state.agents,
    tasks: state.tasks,
    taskLists: state.taskLists,
    calendarActivities: state.calendarActivities,
    notebooks: state.notebooks,
    assets: state.assets,
    projects: state.projects,
    ads: state.ads,
    channels: chatRemote() ? [] : state.channels,
    // Con las tablas de chat activas, nada del chat se escribe en el documento.
    messages: chatRemote() ? [] : state.messages,
    chatScheduled: chatRemote() ? [] : state.chatScheduled,
    chatReminders: chatRemote() ? [] : state.chatReminders,
    team: state.team,
    invitations: state.invitations,
    activityEvents: state.activityEvents,
    notifications: state.notifications.filter((n) => !n.id.startsWith(CHAT_NOTIFICATION_PREFIX)),
    widgets: state.widgets,
    onboarding: state.onboarding,
    dismissedRecommendationIds: state.dismissedRecommendationIds,
    appliedRecommendationsMap: state.appliedRecommendationsMap,
  };
}

export function persistWorkspaceState(state: HublyStoreState): void {
  if (typeof window === "undefined") return;
  if (isReferenceFixtureUrl()) return;
  if (backendEnabled) {
    queueLiveSave(extractWorkspaceData(state));
    return;
  }
  const wsId = state.workspaceId || "default";
  const payload = extractWorkspaceData(state);
  saveWorkspaceToStorage(wsId, payload);
  pushWorkspaceToApi(wsId, payload).catch(() => {});
}
