// Ayudantes compartidos por las acciones del store.
import { localIsoDate } from "../date";
import { backendEnabled } from "../supabase/config";
import { queueLiveSave } from "../live-workspace";
import { isReferenceFixtureUrl, pushWorkspaceToApi, saveWorkspaceToStorage } from "../workspace-repository";
import type {
  ActivityEvent,
  ActivityEventType,
  AutomationTrigger,
  HublyWorkspaceData,
  PostStatus,
  SocialPost,
} from "../types";
import type { HublyStoreState } from "../store";

export function extractWorkspaceData(state: HublyStoreState): HublyWorkspaceData {
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
    tasks: state.tasks,
    taskLists: state.taskLists,
    calendarActivities: state.calendarActivities,
    notebooks: state.notebooks,
    assets: state.assets,
    projects: state.projects,
    ads: state.ads,
    channels: state.channels,
    messages: state.messages,
    team: state.team,
    invitations: state.invitations,
    activityEvents: state.activityEvents,
    notifications: state.notifications,
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

export function withPostLog(post: SocialPost, text: string, author: string): SocialPost {
  const at = new Date().toISOString();
  const entry = { id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author, text, at };
  return { ...post, activity: [entry, ...(post.activity || [])] };
}

export const STATUS_TO_TRIGGER: Partial<Record<PostStatus, AutomationTrigger>> = {
  pending: "post_pending",
  changes: "post_changes",
  approved: "post_approved",
};

/** Se ejecuta en el navegador: sin backend no hay reglas corriendo en segundo plano. */
export function runAutomations(
  get: () => HublyStoreState,
  set: (patch: Partial<HublyStoreState>) => void,
  postId: string,
  status: PostStatus
) {
  const trigger = STATUS_TO_TRIGGER[status];
  const state = get();
  const post = state.posts.find((p) => p.id === postId);
  if (!trigger || !post) return;
  const fired = (state.automations || []).filter((r) => r.enabled && r.trigger === trigger);
  if (fired.length === 0) return;
  const today = localIsoDate();
  for (const rule of fired) {
    const text = rule.text.split("{post}").join(post.title);
    if (rule.action === "create_task") {
      state.addTask({
        brandId: post.brandId,
        title: text,
        dueLabel: "Hoy",
        dueDate: today,
        assignee: post.assignee || state.profile?.name || "Equipo",
        listName: "Automatizaciones",
        status: "todo",
        priority: "media",
      });
    } else {
      state.addNotification({ brandId: post.brandId, title: rule.name, body: text, kind: "sistema", actionUrl: "/parrillas" });
    }
  }
  const at = new Date().toISOString();
  const firedIds = new Set(fired.map((r) => r.id));
  set({
    automations: (get().automations || []).map((r) =>
      firedIds.has(r.id) ? { ...r, runs: r.runs + 1, lastRunAt: at } : r
    ),
  });
}

export function createActivityItem(
  state: HublyStoreState,
  partial: {
    type: ActivityEventType;
    memberId?: string;
    brandId?: string;
    durationMinutes?: number;
    metadata?: Record<string, string | number | boolean>;
    timestamp?: string;
  }
): ActivityEvent {
  const defaultMemberId = state.team[0]?.id || "tm-1";
  const clockIso = state.testClock?.fixedIsoNow || new Date().toISOString();

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    memberId: partial.memberId || defaultMemberId,
    brandId: partial.brandId || state.activeBrandId,
    type: partial.type,
    timestamp: partial.timestamp || clockIso,
    durationMinutes: partial.durationMinutes ?? 15,
    metadata: partial.metadata,
  };
}
