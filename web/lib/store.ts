"use client";

import { create } from "zustand";
import {
  createSeedWorkspaceData,
  rebaseStaleFixture,
  DEFAULT_WIDGETS_CONFIG,
  INITIAL_WORKSPACE_DATA,
  REFERENCE_FIXTURE_CLOCK,
} from "./seed-data";
import { selectAccountRecommendations } from "./domain-selectors";
import { localIsoDate } from "./date";
import { moveInList } from "./use-kanban-drag";
import { backendEnabled } from "./supabase/config";
import { currentAgencyId, loadLiveWorkspace, queueLiveSave } from "./live-workspace";
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
} from "./workspace-repository";
import type {
  AccountCommitment,
  ActivityEvent,
  ActivityEventType,
  AgencyInfo,
  AgencyTask,
  BrandCore,
  BrandProject,
  BrandWorkspace,
  AutomationRule,
  AutomationTrigger,
  ContentIdea,
  CustomCommitmentMetric,
  Lead,
  LeadStage,
  Quote,
  DashboardMetricId,
  DashboardWidgetConfig,
  DashboardWidgetId,
  DashboardWidgetSpan,
  HublyWorkspaceData,
  MediaAsset,
  NotebookItem,
  PeriodCommitmentSnapshot,
  PostExtrasPatch,
  PostStatus,
  PostStatusLabel,
  SocialNetwork,
  SocialPost,
  TeamInvitation,
  TeamMember,
  WorkspaceNotification,
  WorkspaceProfile,
} from "./types";

export type CommitmentPeriodKey = "mes_actual" | "mes_anterior" | "trimestre";

export type OnboardingStepKey =
  | "redes"
  | "post"
  | "aprueba"
  | "equipo"
  | "brandCreatedOrSelected"
  | "postCreatedOrScheduled"
  | "taskCreatedOrCompleted"
  | "teamCheckedOrInvited";

export type AddBrandInput = {
  name: string;
  initials?: string;
  initial?: string;
  handle?: string;
  color?: string;
  avatarBg?: string;
  avatarColor?: string;
  industry?: string;
  city?: string;
  connectedNetworks?: SocialNetwork[];
  monthlyPostTarget?: number;
  monthlyBudget?: number;
  adBudget?: number;
  hasPaidAds?: boolean;
  whatTheySell?: string;
};

export type AddTaskInput = Omit<
  AgencyTask,
  | "id"
  | "completed"
  | "assigneeId"
  | "assigneeName"
  | "assigneeInitial"
  | "tags"
  | "dueBucket"
> & {
  completed?: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeInitial?: string;
  tags?: string[];
  dueBucket?: AgencyTask["dueBucket"];
};

export interface HublyStoreState extends HublyWorkspaceData {
  hydrated: boolean;
  /** Rol en la agencia con backend real; null en el modo demo. */
  role: string | null;
  isReferenceFixture: boolean;
  teamMembers: TeamMember[];
  dashboardWidgets: DashboardWidgetConfig[];
  composerOpen: boolean;
  editingPostId: string | null;
  cmdkOpen: boolean;
  aiDrawerOpen: boolean;
  newBrandModalOpen: boolean;
  inviteModalOpen: boolean;
  widgetConfigModalOpen: boolean;
  autoSuggestionsModalOpen: boolean;
  editWidgetsMode: boolean;
  activeNotebookId: string | null;

  // UI & Modal Actions
  setActiveBrand: (brandId: string) => void;
  composerDefaultDate: string | null;
  /** El editor tiene cambios sin guardar: abrir otro post pide decidir antes. */
  composerDirty: boolean;
  composerPending: { postId: string | null; defaultDate: string | null } | null;
  setComposerDirty: (dirty: boolean) => void;
  resolveComposerPending: (decision: "open" | "keep") => void;
  openComposer: (postId?: string | null, defaultDate?: string | null) => void;
  closeComposer: () => void;
  setCmdkOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;
  setNewBrandModalOpen: (open: boolean) => void;
  setInviteModalOpen: (open: boolean) => void;
  setWidgetConfigModalOpen: (open: boolean) => void;
  setAutoSuggestionsModalOpen: (open: boolean) => void;
  setEditWidgetsMode: (enabled: boolean) => void;
  setActiveNotebookId: (notebookId: string | null) => void;

  // Workspace, Hydration & Fixture Actions
  syncFromServer: (workspaceIdOverride?: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  applyReferenceFixture: () => void;
  setTestClock: (fixedIsoNow: string | null) => void;
  resetDemoData: (options?: { referenceFixture?: boolean }) => void;

  // Profile & Agency Actions
  updateProfile: (patch: Partial<WorkspaceProfile>) => void;
  updateAgency: (patch: Partial<AgencyInfo>) => void;

  // Brand & Commitment Actions
  addBrand: (brand: AddBrandInput) => void;
  updateBrand: (brandId: string, patch: Partial<BrandWorkspace>) => void;
  updateBrandCore: (brandId: string, corePatch: Partial<BrandCore>) => void;
  togglePersonaAccepted: (brandId: string, personaId: string) => void;
  updateBrandCommitments: (
    brandId: string,
    patch: Partial<AccountCommitment> & Partial<PeriodCommitmentSnapshot>,
    periodKey?: CommitmentPeriodKey
  ) => void;
  setBrandCustomMetrics: (
    brandId: string,
    customMetrics: CustomCommitmentMetric[]
  ) => void;

  // Recommendations Engine Actions
  applyRecommendation: (recommendationId: string) => void;
  applyRecommendationsBatch: (recommendationIds?: string[]) => void;
  dismissRecommendation: (recommendationId: string) => void;

  // Post / Content Actions
  savePost: (post: Omit<SocialPost, "id" | "comments"> & { id?: string }) => void;
  updatePostStatus: (
    postId: string,
    status: PostStatus,
    commentText?: string,
    authorName?: string,
    role?: "client" | "agency"
  ) => void;
  approveAllBrandPosts: (brandId: string, authorName?: string, role?: "client" | "agency") => void;
  /** Cambio puntual desde tabla o Kanban; el estado de publicación va por updatePostStatus. */
  updatePostFields: (postId: string, patch: Partial<Pick<SocialPost, "workflowStatusId" | "format" | "assigneeIds" | "assignee" | "customFields" | "pillar">>) => void;
  deletePost: (postId: string) => void;
  /** Devuelve el id de la copia, que nace como borrador sin fecha ni resultados. */
  duplicatePost: (postId: string) => string | null;
  movePost: (postId: string, scheduledDate: string) => void;
  recordPublication: (postId: string, publication: { url: string; date: string }) => void;
  setPostResults: (postId: string, metrics: NonNullable<SocialPost["metrics"]>) => void;
  setCalendarActivities: (activities: unknown[]) => void;
  patchPost: (postId: string, patch: PostExtrasPatch) => void;
  addPostComment: (postId: string, text: string, authorName: string, role: "client" | "agency") => void;
  addIdea: (idea: Pick<ContentIdea, "brandId" | "title" | "notes" | "pillar">) => void;
  removeIdea: (ideaId: string) => void;
  convertIdeaToPost: (ideaId: string) => void;
  saveLead: (lead: Omit<Lead, "id" | "createdAt"> & { id?: string }) => void;
  moveLead: (leadId: string, stage: LeadStage, beforeId: string | null) => void;
  deleteLead: (leadId: string) => void;
  saveQuote: (quote: Omit<Quote, "id" | "createdAt"> & { id?: string }) => void;
  deleteQuote: (quoteId: string) => void;
  addAutomation: (rule: Pick<AutomationRule, "name" | "trigger" | "action" | "text">) => void;
  toggleAutomation: (ruleId: string) => void;
  removeAutomation: (ruleId: string) => void;

  // Task Actions
  addTask: (task: AddTaskInput) => void;
  updateTask: (taskId: string, patch: Partial<AgencyTask>) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, status: "todo" | "in_progress" | "done", beforeId: string | null) => void;
  addTaskList: (brandId: string, name: string) => void;
  renameTaskList: (brandId: string, oldName: string, newName: string) => void;
  deleteTaskList: (brandId: string, name: string) => void;

  // Notebook Actions
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

  // Team & Activity Actions
  inviteTeamMember: (input: {
    email: string;
    name?: string;
    role: string;
    brandIds?: string[];
  }) => TeamInvitation;
  acceptTeamInvitation: (invitationId: string) => void;
  cancelTeamInvitation: (invitationId: string) => void;
  updateTeamMember: (memberId: string, patch: Partial<TeamMember>) => void;
  recordActivityEvent: (
    event: Omit<ActivityEvent, "id" | "timestamp"> & { timestamp?: string }
  ) => void;

  // Dashboard Widgets & Onboarding Actions
  toggleWidgetVisibility: (widgetId: DashboardWidgetId) => void;
  setWidgetVisibility: (widgetId: DashboardWidgetId, visible: boolean) => void;
  reorderWidgets: (orderedIds: DashboardWidgetId[]) => void;
  moveWidget: (widgetId: DashboardWidgetId, direction: "up" | "down") => void;
  setWidgetSpan: (widgetId: DashboardWidgetId, span: DashboardWidgetSpan) => void;
  setWidgetMetric: (widgetId: DashboardWidgetId, metric: DashboardMetricId) => void;
  resetWidgetsLayout: () => void;
  toggleOnboardingStep: (stepKey: OnboardingStepKey, forceValue?: boolean) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  setOnboardingMinimized: (minimized: boolean) => void;

  // Notifications, Assets, Projects & Chat Actions
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (
    notification: Omit<WorkspaceNotification, "id" | "createdAt" | "read">
  ) => void;
  addAsset: (asset: Omit<MediaAsset, "id" | "uploadedAt" | "usedInPosts">) => void;
  addProject: (project: Omit<BrandProject, "id">) => void;
  moveProject: (projectId: string, status: BrandProject["status"], beforeId: string | null) => void;
  updateProject: (projectId: string, patch: Partial<Omit<BrandProject, "id" | "brandId">>) => void;
  deleteProject: (projectId: string) => void;
  sendChatMessage: (
    channelId: string,
    text: string,
    sender?: string,
    senderInitials?: string
  ) => void;
}

const STATUS_TO_LABEL: Record<PostStatus, PostStatusLabel> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
};

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

function persistWorkspaceState(state: HublyStoreState): void {
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

function withPostLog(post: SocialPost, text: string, author: string): SocialPost {
  const at = new Date().toISOString();
  const entry = { id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author, text, at };
  return { ...post, activity: [entry, ...(post.activity || [])] };
}

const STATUS_TO_TRIGGER: Partial<Record<PostStatus, AutomationTrigger>> = {
  pending: "post_pending",
  changes: "post_changes",
  approved: "post_approved",
};

/** Se ejecuta en el navegador: sin backend no hay reglas corriendo en segundo plano. */
function runAutomations(
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

function createActivityItem(
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

export const useHublyStore = create<HublyStoreState>()((set, get) => ({
  ...INITIAL_WORKSPACE_DATA,
  hydrated: false,
  role: null,
  isReferenceFixture: false,
  teamMembers: INITIAL_WORKSPACE_DATA.team,
  dashboardWidgets: INITIAL_WORKSPACE_DATA.widgets.map((w) => ({
    ...w,
    enabled: w.visible,
  })),
  composerOpen: false,
  editingPostId: null,
  composerDefaultDate: null,
  composerDirty: false,
  composerPending: null,
  cmdkOpen: false,
  aiDrawerOpen: false,
  newBrandModalOpen: false,
  inviteModalOpen: false,
  widgetConfigModalOpen: false,
  autoSuggestionsModalOpen: false,
  editWidgetsMode: false,
  activeNotebookId: null,

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

  updateProfile: (patch) => {
    if (backendEnabled && patch.name) {
      const name = patch.name;
      void import("./supabase/browser").then(({ createSupabaseBrowser }) =>
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

  addBrand: (input) => {
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `brand-${Date.now()}`;
    const initials = (input.initials || input.name.slice(0, 2)).toUpperCase();
    const initial = (input.initial || initials.slice(0, 1) || "M").toUpperCase();
    const color = input.color || "#0a7a55";
    const networks: SocialNetwork[] =
      input.connectedNetworks && input.connectedNetworks.length > 0
        ? input.connectedNetworks
        : ["Instagram", "TikTok"];
    const monthlyTarget = input.monthlyPostTarget || 12;
    const hasPaidAds = input.hasPaidAds ?? Boolean(input.adBudget && input.adBudget > 0);
    const adBudget = input.adBudget ?? (hasPaidAds ? 450 : 0);

    const commitments: AccountCommitment = {
      period: "mes_actual",
      postsCommitted: monthlyTarget,
      postsCompleted: 0,
      StoriesCommitted: 12,
      StoriesCompleted: 0,
      storiesCommitted: 12,
      storiesCompleted: 0,
      reelsCommitted: 4,
      reelsCompleted: 0,
      adCampaignsCommitted: hasPaidAds ? 2 : 0,
      adCampaignsCompleted: 0,
      hasDeclaredCommitments: true,
      customMetrics: [],
      periodHistory: {
        mes_actual: {
          period: "mes_actual",
          postsCommitted: monthlyTarget,
          postsCompleted: 0,
          StoriesCommitted: 12,
          StoriesCompleted: 0,
          storiesCommitted: 12,
          storiesCompleted: 0,
          reelsCommitted: 4,
          reelsCompleted: 0,
          adCampaignsCommitted: hasPaidAds ? 2 : 0,
          adCampaignsCompleted: 0,
          adSpend: adBudget,
          reachTotal: 12400,
          clicksTotal: 420,
          landingPageViewsPerWeek: 4.5,
          clicksPerWeek: 240,
        },
        mes_anterior: {
          period: "mes_anterior",
          postsCommitted: monthlyTarget,
          postsCompleted: monthlyTarget,
          StoriesCommitted: 12,
          StoriesCompleted: 12,
          storiesCommitted: 12,
          storiesCompleted: 12,
          reelsCommitted: 4,
          reelsCompleted: 4,
          adCampaignsCommitted: hasPaidAds ? 2 : 0,
          adCampaignsCompleted: hasPaidAds ? 2 : 0,
          adSpend: adBudget,
          reachTotal: 18500,
          clicksTotal: 610,
          landingPageViewsPerWeek: 5.2,
          clicksPerWeek: 310,
        },
        trimestre: {
          period: "trimestre",
          postsCommitted: monthlyTarget * 3,
          postsCompleted: monthlyTarget * 2,
          StoriesCommitted: 36,
          StoriesCompleted: 28,
          storiesCommitted: 36,
          storiesCompleted: 28,
          reelsCommitted: 12,
          reelsCompleted: 9,
          adCampaignsCommitted: hasPaidAds ? 6 : 0,
          adCampaignsCompleted: hasPaidAds ? 4 : 0,
          adSpend: adBudget * 3,
          reachTotal: 48200,
          clicksTotal: 1640,
          landingPageViewsPerWeek: 5.0,
          clicksPerWeek: 295,
        },
      },
    };

    const newBrand: BrandWorkspace = {
      id,
      name: input.name,
      handle: input.handle || `@${slug.replace(/-/g, "")}`,
      slug,
      shareToken: `${slug}-nov`,
      initial,
      initials,
      color,
      avatarBg: input.avatarBg || "#ecfdf5",
      avatarColor: input.avatarColor || color,
      industry: input.industry || "Comercio y servicios",
      city: input.city || "Ciudad de México",
      connectedNetworks: networks,
      Networks: networks,
      monthlyPostTarget: monthlyTarget,
      monthlyBudget: input.monthlyBudget ?? 1200,
      adBudget,
      hasPaidAds,
      paidAdsLabel: hasPaidAds ? "con pauta" : "sin pauta",
      healthScore: 90,
      healthStatus: "en_progreso",
      commitments,
      core: {
        whatTheySell: input.whatTheySell || `Productos y servicios de ${input.name}.`,
        category: input.industry || "Marca comercial",
        websiteUrl: `https://${slug}.ejemplo`,
        toneOfVoice: "Directo, claro y cercano a su comunidad.",
        pillars: ["Educación y valor", "Producto en uso", "Comunidad y testimonios"],
        doWords: ["calidad", "hecho a medida", "cercano"],
        dontWords: ["relleno", "spam"],
        personas: [
          {
            id: `bp-${Date.now()}-1`,
            name: "Cliente Ideal Principal",
            ageRange: "26–42 años",
            occupation: "Profesional urbano",
            painPoints: "Busca soluciones confiables sin perder tiempo comparando opciones.",
            motivation: "Calidad constante y atención rápida por canales digitales.",
            accepted: true,
          },
        ],
      },
      bioLink: {
        handle: slug,
        headline: `${input.name} · Enlaces oficiales`,
        whatsapp: "+52 55 0000 0000",
        buttons: [{ id: "btn-1", label: "Hablar por WhatsApp", url: "https://wa.me/525500000000" }],
      },
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId: id,
        metadata: { action: "brand_created", brandName: input.name },
      });
      return {
        brands: [...s.brands, newBrand],
        activeBrandId: id,
        channels: [
          ...s.channels,
          { id: `ch-${slug}`, name: `# ${slug}`, type: "brand", brandId: id, unread: 0 },
        ],
        onboarding: {
          ...s.onboarding,
          brandCreatedOrSelected: true,
        },
        activityEvents: [event, ...s.activityEvents],
        newBrandModalOpen: false,
      };
    });
    persistWorkspaceState(get());
  },

  updateBrand: (brandId, patch) => {
    set((s) => ({
      brands: s.brands.map((b) => {
        if (b.id !== brandId) return b;
        const nextNetworks = patch.connectedNetworks ?? patch.Networks ?? b.connectedNetworks;
        const nextHasPaidAds = patch.hasPaidAds ?? b.hasPaidAds;
        return {
          ...b,
          ...patch,
          connectedNetworks: nextNetworks,
          Networks: nextNetworks,
          hasPaidAds: nextHasPaidAds,
          paidAdsLabel:
            patch.paidAdsLabel ?? (nextHasPaidAds ? "con pauta" : "sin pauta"),
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  updateBrandCore: (brandId, corePatch) => {
    set((s) => ({
      brands: s.brands.map((b) =>
        b.id === brandId ? { ...b, core: { ...b.core, ...corePatch } } : b
      ),
      onboarding: {
        ...s.onboarding,
        brandCreatedOrSelected: true,
      },
    }));
    persistWorkspaceState(get());
  },

  togglePersonaAccepted: (brandId, personaId) => {
    set((s) => ({
      brands: s.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              core: {
                ...b.core,
                personas: b.core.personas.map((p) =>
                  p.id === personaId ? { ...p, accepted: !p.accepted } : p
                ),
              },
            }
          : b
      ),
    }));
    persistWorkspaceState(get());
  },

  updateBrandCommitments: (brandId, patch, periodKey = "mes_actual") => {
    set((s) => {
      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId,
        metadata: { period: periodKey },
      });

      return {
        brands: s.brands.map((b) => {
          if (b.id !== brandId) return b;
          const prev = b.commitments;
          const prevSnap = prev.periodHistory[periodKey];
          const storiesComm =
            patch.StoriesCommitted ??
            patch.storiesCommitted ??
            prevSnap.StoriesCommitted;
          const storiesComp =
            patch.StoriesCompleted ??
            patch.storiesCompleted ??
            prevSnap.StoriesCompleted;

          const updatedSnap: PeriodCommitmentSnapshot = {
            ...prevSnap,
            ...patch,
            period: periodKey,
            StoriesCommitted: storiesComm,
            storiesCommitted: storiesComm,
            StoriesCompleted: storiesComp,
            storiesCompleted: storiesComp,
          };

          const isCurrent = periodKey === "mes_actual";
          const nextCommitments: AccountCommitment = {
            ...prev,
            ...(isCurrent
              ? {
                  postsCommitted: updatedSnap.postsCommitted,
                  postsCompleted: updatedSnap.postsCompleted,
                  StoriesCommitted: updatedSnap.StoriesCommitted,
                  StoriesCompleted: updatedSnap.StoriesCompleted,
                  storiesCommitted: updatedSnap.storiesCommitted,
                  storiesCompleted: updatedSnap.storiesCompleted,
                  reelsCommitted: updatedSnap.reelsCommitted,
                  reelsCompleted: updatedSnap.reelsCompleted,
                  adCampaignsCommitted: updatedSnap.adCampaignsCommitted,
                  adCampaignsCompleted: updatedSnap.adCampaignsCompleted,
                }
              : {}),
            hasDeclaredCommitments: patch.hasDeclaredCommitments ?? true,
            customMetrics: patch.customMetrics ?? prev.customMetrics,
            periodHistory: {
              ...prev.periodHistory,
              [periodKey]: updatedSnap,
            },
          };

          return {
            ...b,
            monthlyPostTarget: isCurrent
              ? nextCommitments.postsCommitted
              : b.monthlyPostTarget,
            commitments: nextCommitments,
          };
        }),
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  setBrandCustomMetrics: (brandId, customMetrics) => {
    get().updateBrandCommitments(brandId, {
      customMetrics,
      hasDeclaredCommitments: true,
    });
  },

  applyRecommendation: (recommendationId) => {
    set((s) => {
      const allRecs = selectAccountRecommendations(
        s.brands,
        s.tasks,
        s.posts,
        s.dismissedRecommendationIds,
        s.appliedRecommendationsMap
      );
      const rec = allRecs.find((r) => r.id === recommendationId);
      if (!rec) return s;

      const nextBrands = s.brands.map((b) => {
        if (b.id !== rec.brandId) return b;
        const prev = b.commitments;
        const actual = prev.periodHistory.mes_actual;

        const nextPostsCommitted =
          rec.metricKey === "posts" ? rec.recommendedCommitted : prev.postsCommitted;
        const nextReelsCommitted =
          rec.metricKey === "reels" ? rec.recommendedCommitted : prev.reelsCommitted;
        const nextStoriesCommitted =
          rec.metricKey === "stories" ? rec.recommendedCommitted : prev.StoriesCommitted;
        const nextAdsCommitted =
          rec.metricKey === "ads" ? rec.recommendedCommitted : prev.adCampaignsCommitted;

        return {
          ...b,
          monthlyPostTarget: nextPostsCommitted,
          commitments: {
            ...prev,
            postsCommitted: nextPostsCommitted,
            reelsCommitted: nextReelsCommitted,
            StoriesCommitted: nextStoriesCommitted,
            storiesCommitted: nextStoriesCommitted,
            adCampaignsCommitted: nextAdsCommitted,
            hasDeclaredCommitments: true,
            periodHistory: {
              ...prev.periodHistory,
              mes_actual: {
                ...actual,
                postsCommitted: nextPostsCommitted,
                reelsCommitted: nextReelsCommitted,
                StoriesCommitted: nextStoriesCommitted,
                storiesCommitted: nextStoriesCommitted,
                adCampaignsCommitted: nextAdsCommitted,
              },
            },
          },
        };
      });

      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId: rec.brandId,
        durationMinutes: 10,
        metadata: {
          recommendationId: rec.id,
          ruleId: rec.ruleId,
          recommendedCommitted: rec.recommendedCommitted,
        },
      });

      return {
        brands: nextBrands,
        appliedRecommendationsMap: {
          ...s.appliedRecommendationsMap,
          [recommendationId]: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  applyRecommendationsBatch: (recommendationIds) => {
    const state = get();
    const allRecs = selectAccountRecommendations(
      state.brands,
      state.tasks,
      state.posts,
      state.dismissedRecommendationIds,
      state.appliedRecommendationsMap
    );
    const targetIds =
      recommendationIds && recommendationIds.length > 0
        ? recommendationIds
        : allRecs.filter((r) => !r.applied).map((r) => r.id);

    for (const id of targetIds) {
      get().applyRecommendation(id);
    }
  },

  dismissRecommendation: (recommendationId) => {
    set((s) => ({
      dismissedRecommendationIds: s.dismissedRecommendationIds.includes(recommendationId)
        ? s.dismissedRecommendationIds
        : [...s.dismissedRecommendationIds, recommendationId],
    }));
    persistWorkspaceState(get());
  },

  savePost: (postInput) => {
    const previousStatus = get().posts.find((p) => p.id === postInput.id)?.status;
    set((s) => {
      const statusLabel =
        postInput.statusLabel || STATUS_TO_LABEL[postInput.status] || "Borrador";
      if (postInput.id) {
        return {
          posts: s.posts.map((p) =>
            p.id === postInput.id
              ? withPostLog(
                  {
                    ...p,
                    ...postInput,
                    statusLabel,
                    id: p.id,
                    comments: p.comments,
                  },
                  `Guardó el post como «${statusLabel}»`,
                  s.profile?.name || "Equipo"
                )
              : p
          ),
          composerOpen: false,
          editingPostId: null,
        };
      }
      const createdId = `post-${Date.now()}`;
      const created = withPostLog(
        {
          ...postInput,
          id: createdId,
          statusLabel,
          comments: [],
        },
        "Creó el post",
        s.profile?.name || "Equipo"
      );
      const event = createActivityItem(s, {
        type: created.status === "published" ? "post_published" : "post_submitted",
        brandId: created.brandId,
        durationMinutes: 25,
        metadata: { postId: createdId, title: created.title },
      });
      return {
        posts: [created, ...s.posts],
        onboarding: {
          ...s.onboarding,
          postCreatedOrScheduled: true,
        },
        activityEvents: [event, ...s.activityEvents],
        composerOpen: false,
        editingPostId: null,
      };
    });
    const savedId = postInput.id || get().posts[0]?.id;
    if (savedId && previousStatus !== postInput.status) {
      runAutomations(get, set, savedId, postInput.status);
    }
    persistWorkspaceState(get());
  },

  updatePostStatus: (postId, status, commentText, authorName = "Cliente", role = "client") => {
    set((s) => {
      let targetBrandId = s.activeBrandId;
      const nextPosts = s.posts.map((p) => {
        if (p.id !== postId) return p;
        targetBrandId = p.brandId;
        const nextComments = commentText?.trim()
          ? [
              ...p.comments,
              {
                id: `c-${Date.now()}`,
                author: authorName,
                role,
                text: commentText.trim(),
                createdAt: "Ahora mismo",
              },
            ]
          : p.comments;
        return withPostLog(
          {
            ...p,
            status,
            statusLabel: STATUS_TO_LABEL[status] || p.statusLabel,
            comments: nextComments,
          },
          `Cambió el estado a «${STATUS_TO_LABEL[status] || status}»`,
          authorName
        );
      });

      const event = createActivityItem(s, {
        type: status === "published" ? "post_published" : status === "approved" ? "post_approved" : "post_submitted",
        brandId: targetBrandId,
        durationMinutes: 15,
        metadata: { postId, status },
      });

      return {
        posts: nextPosts,
        activityEvents: [event, ...s.activityEvents],
      };
    });
    runAutomations(get, set, postId, status);
    persistWorkspaceState(get());
  },

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

  recordPublication: (postId, { url, date }) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? withPostLog(
              { ...p, status: "published", statusLabel: "Publicado", publishedUrl: url || undefined, scheduledDate: date || p.scheduledDate },
              "Registró la publicación a mano",
              s.profile?.name || "Equipo"
            )
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  setPostResults: (postId, metrics) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? withPostLog({ ...p, metrics, metricsSource: "manual" }, "Capturó resultados a mano", s.profile?.name || "Equipo")
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  setCalendarActivities: (activities) => {
    set({ calendarActivities: activities });
    persistWorkspaceState(get());
  },

  updatePostFields: (postId, patch) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? withPostLog({ ...p, ...patch }, "Actualizó el post desde el calendario", s.profile?.name || "Equipo") : p)),
    }));
    persistWorkspaceState(get());
  },

  deletePost: (postId) => {
    set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }));
    persistWorkspaceState(get());
  },

  duplicatePost: (postId) => {
    const source = get().posts.find((p) => p.id === postId);
    if (!source) return null;
    const id = `post-${Date.now()}`;
    const copy: SocialPost = withPostLog(
      {
        ...source,
        id,
        title: `${source.title} (copia)`,
        status: "draft",
        statusLabel: "Borrador",
        scheduledDate: "",
        scheduledTime: "",
        comments: [],
        metrics: undefined,
        metricsSource: undefined,
        publishedUrl: undefined,
        chat: [],
        activity: [],
      },
      `Duplicó «${source.title}»`,
      get().profile?.name || "Equipo"
    );
    set((s) => ({ posts: [copy, ...s.posts] }));
    persistWorkspaceState(get());
    return id;
  },

  movePost: (postId, scheduledDate) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId && p.scheduledDate !== scheduledDate
          ? withPostLog({ ...p, scheduledDate }, `Movió la fecha a ${scheduledDate}`, s.profile?.name || "Equipo")
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  patchPost: (postId, patch) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
    }));
    persistWorkspaceState(get());
  },

  addPostComment: (postId, text, authorName, role) => {
    const clean = text.trim();
    if (!clean) return;
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c-${Date.now()}`, author: authorName, role, text: clean, createdAt: "Ahora mismo" },
              ],
            }
          : p
      ),
    }));
    persistWorkspaceState(get());
  },

  addIdea: (idea) => {
    set((s) => ({
      ideas: [
        { ...idea, id: `idea-${Date.now()}`, createdAt: new Date().toISOString() },
        ...(s.ideas || []),
      ],
    }));
    persistWorkspaceState(get());
  },

  removeIdea: (ideaId) => {
    set((s) => ({ ideas: (s.ideas || []).filter((i) => i.id !== ideaId) }));
    persistWorkspaceState(get());
  },

  convertIdeaToPost: (ideaId) => {
    const idea = (get().ideas || []).find((i) => i.id === ideaId);
    if (!idea) return;
    const postId = idea.convertedPostId || `post-${Date.now()}`;
    if (!idea.convertedPostId) {
      set((s) => {
        const created = withPostLog(
          {
            id: postId,
            brandId: idea.brandId,
            title: idea.title,
            caption: idea.notes,
            network: "Instagram",
            networks: ["Instagram"],
            format: "Carrusel",
            cover: "steam",
            scheduledDate: localIsoDate(),
            scheduledTime: "11:30",
            status: "draft",
            statusLabel: "Borrador",
            assignee: s.profile?.name || "Equipo",
            pillar: idea.pillar || "General",
            comments: [],
          },
          "Creó el post desde una idea",
          s.profile?.name || "Equipo"
        );
        return {
          posts: [created, ...s.posts],
          ideas: (s.ideas || []).map((i) => (i.id === ideaId ? { ...i, convertedPostId: postId } : i)),
        };
      });
      persistWorkspaceState(get());
    }
    get().openComposer(postId);
  },

  approveAllBrandPosts: (brandId, authorName = "Cliente", role = "client") => {
    const approvedIds = get()
      .posts.filter((p) => p.brandId === brandId && (p.status === "pending" || p.status === "changes"))
      .map((p) => p.id);
    if (approvedIds.length === 0) return;
    const commentText = role === "client" ? "Aprobado en lote desde el enlace de revisión." : "Aprobado en lote por la agencia.";
    set((s) => ({
      posts: s.posts.map((p, index) => {
        if (!approvedIds.includes(p.id)) return p;
        return withPostLog(
          {
            ...p,
            status: "approved",
            statusLabel: "Aprobado",
            comments: [
              ...p.comments,
              { id: `c-${Date.now()}-${index}`, author: authorName, role, text: commentText, createdAt: "Ahora mismo" },
            ],
          },
          "Aprobó el post en lote",
          authorName
        );
      }),
      activityEvents: [
        ...approvedIds.map((postId) =>
          createActivityItem(s, { type: "post_approved", brandId, durationMinutes: 5, metadata: { postId, status: "approved" } })
        ),
        ...s.activityEvents,
      ],
    }));
    for (const id of approvedIds) runAutomations(get, set, id, "approved");
    persistWorkspaceState(get());
  },

  addTask: (taskInput) => {
    set((s) => {
      const id = `task-${Date.now()}`;
      const brand = s.brands.find((b) => b.id === taskInput.brandId);
      const assigneeName =
        taskInput.assigneeName || taskInput.assignee || s.profile.name || "Jair";
      const assigneeInitial =
        taskInput.assigneeInitial || assigneeName.slice(0, 1).toUpperCase() || "J";
      const matchedMember = s.team.find(
        (m) => m.name.toLowerCase() === assigneeName.toLowerCase()
      );
      const assigneeId = taskInput.assigneeId || matchedMember?.id || "tm-1";
      const completed =
        taskInput.completed ??
        (taskInput.status === "done" || taskInput.status === "completada");
      const tags =
        taskInput.tags && taskInput.tags.length > 0
          ? taskInput.tags
          : [brand?.name || "Agencia", taskInput.listName || "Primeros pasos"];

      const createdTask: AgencyTask = {
        ...taskInput,
        id,
        completed,
        assigneeId,
        assignee: assigneeName,
        assigneeName,
        assigneeInitial,
        tags,
        dueBucket: taskInput.dueBucket || "today",
      };

      const event = createActivityItem(s, {
        type: "task_started",
        memberId: assigneeId,
        brandId: taskInput.brandId,
        durationMinutes: 15,
        metadata: { taskId: id, title: taskInput.title },
      });

      return {
        tasks: [createdTask, ...s.tasks],
        onboarding: {
          ...s.onboarding,
          taskCreatedOrCompleted: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  updateTask: (taskId, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus =
          patch.status ??
          (patch.completed !== undefined ? (patch.completed ? "done" : "todo") : t.status);
        const nextCompleted =
          patch.completed !== undefined
            ? patch.completed
            : nextStatus === "done" || nextStatus === "completada";
        return {
          ...t,
          ...patch,
          status: nextStatus,
          completed: nextCompleted,
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  toggleTaskStatus: (taskId) => {
    set((s) => {
      let toggledTask: AgencyTask | undefined;
      let becameDone = false;
      const nowIso = s.testClock?.fixedIsoNow || new Date().toISOString();

      const nextTasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        toggledTask = t;
        const isCurrentlyDone =
          t.status === "done" || t.status === "completada" || t.completed;
        becameDone = !isCurrentlyDone;
        const nextStatus: AgencyTask["status"] = becameDone ? "done" : "todo";
        return {
          ...t,
          status: nextStatus,
          completed: becameDone,
          completedAt: becameDone ? nowIso : undefined,
          dueLabel: becameDone
            ? "Completada"
            : t.dueLabel === "Completada"
            ? "Hoy"
            : t.dueLabel,
        };
      });

      if (!toggledTask) return s;

      const event = createActivityItem(s, {
        type: becameDone ? "task_completed" : "task_started",
        memberId: toggledTask.assigneeId || "tm-1",
        brandId: toggledTask.brandId,
        durationMinutes: becameDone ? 20 : 5,
        metadata: { taskId: toggledTask.id, title: toggledTask.title },
      });

      return {
        tasks: nextTasks,
        onboarding: {
          ...s.onboarding,
          taskCreatedOrCompleted: becameDone ? true : s.onboarding.taskCreatedOrCompleted,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  deleteTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
    }));
    persistWorkspaceState(get());
  },

  moveTask: (taskId, status, beforeId) => {
    set((s) => ({
      tasks: moveInList(s.tasks, taskId, beforeId, (t) => ({
        ...t,
        status,
        completed: status === "done",
        completedAt: status === "done" ? new Date().toISOString() : undefined,
      })),
    }));
    persistWorkspaceState(get());
  },

  addTaskList: (brandId, name) => {
    set((s) => ({
      taskLists: [...(s.taskLists || []), { id: `list-${Date.now()}`, brandId, name }],
    }));
    persistWorkspaceState(get());
  },

  renameTaskList: (brandId, oldName, newName) => {
    const inList = (x: { brandId: string }) => x.brandId === brandId;
    set((s) => {
      const known = (s.taskLists || []).some((l) => inList(l) && l.name === oldName);
      return {
        tasks: s.tasks.map((t) => (inList(t) && t.listName === oldName ? { ...t, listName: newName } : t)),
        taskLists: known
          ? (s.taskLists || []).map((l) => (inList(l) && l.name === oldName ? { ...l, name: newName } : l))
          : [...(s.taskLists || []), { id: `list-${Date.now()}`, brandId, name: newName }],
      };
    });
    persistWorkspaceState(get());
  },

  deleteTaskList: (brandId, name) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => !(t.brandId === brandId && t.listName === name)),
      taskLists: (s.taskLists || []).filter((l) => !(l.brandId === brandId && l.name === name)),
    }));
    persistWorkspaceState(get());
  },

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

  inviteTeamMember: (input) => {
    const nowIso = new Date().toISOString();
    const cleanEmail = input.email.trim().toLowerCase();
    const rawName =
      input.name?.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Nuevo Miembro";

    const brandIds =
      input.brandIds && input.brandIds.length > 0
        ? input.brandIds
        : [get().activeBrandId];

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      name: rawName,
      role: input.role || "Content Creator",
      brandIds,
      createdAt: nowIso,
      status: "Pendiente",
      inviteLink: `https://hubly.cm/invite/${Date.now().toString(36)}`,
    };

    const initials = rawName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: rawName,
      initials: initials || "NM",
      avatarInitial: initials.slice(0, 1) || "N",
      avatarColor: "#4338ca",
      role: invitation.role,
      email: cleanEmail,
      status: "Invitado",
      baseActiveMinutes: 15,
      brandIds,
      brandsCount: brandIds.length,
      tasksCompleted: 0,
      tasksInProgress: 0,
      postsPublished: 0,
      activeTimeLabel: "menos de un minuto",
      points: 50,
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "session_active",
        brandId: s.activeBrandId,
        durationMinutes: 5,
        metadata: { invitedEmail: cleanEmail, role: invitation.role },
      });

      return {
        invitations: [invitation, ...s.invitations],
        team: [...s.team, newMember],
        teamMembers: [...s.team, newMember],
        onboarding: {
          ...s.onboarding,
          teamCheckedOrInvited: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
    return invitation;
  },

  acceptTeamInvitation: (invitationId) => {
    set((s) => ({
      invitations: s.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: "Aceptada" as const } : inv
      ),
    }));
    persistWorkspaceState(get());
  },

  cancelTeamInvitation: (invitationId) => {
    set((s) => ({
      invitations: s.invitations.filter((inv) => inv.id !== invitationId),
    }));
    persistWorkspaceState(get());
  },

  updateTeamMember: (memberId, patch) => {
    set((s) => ({
      team: s.team.map((m) => {
        if (m.id !== memberId) return m;
        const nextBrandIds = patch.brandIds ?? m.brandIds ?? [];
        return {
          ...m,
          ...patch,
          brandIds: nextBrandIds,
          brandsCount: patch.brandsCount ?? nextBrandIds.length,
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  recordActivityEvent: (eventInput) => {
    set((s) => {
      const event = createActivityItem(s, eventInput);
      return {
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  toggleWidgetVisibility: (widgetId) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  setWidgetVisibility: (widgetId, visible) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  reorderWidgets: (orderedIds) => {
    set((s) => {
      const byId = new Map<DashboardWidgetId, DashboardWidgetConfig>(
        s.widgets.map((w) => [w.id, w])
      );
      const reordered: DashboardWidgetConfig[] = [];
      orderedIds.forEach((id, idx) => {
        const found = byId.get(id);
        if (found) {
          reordered.push({ ...found, order: idx + 1 });
          byId.delete(id);
        }
      });
      byId.forEach((remaining) => {
        reordered.push({ ...remaining, order: reordered.length + 1 });
      });
      return {
        widgets: reordered,
      };
    });
    persistWorkspaceState(get());
  },

  moveWidget: (widgetId, direction) => {
    set((s) => {
      const sorted = [...s.widgets].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === widgetId);
      if (index === -1) return s;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return s;

      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;

      const normalized = sorted.map((w, idx) => ({ ...w, order: idx + 1 }));
      return {
        widgets: normalized,
      };
    });
    persistWorkspaceState(get());
  },

  setWidgetSpan: (widgetId, span) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, span } : w)),
    }));
    persistWorkspaceState(get());
  },

  setWidgetMetric: (widgetId, metric) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, metric } : w)),
    }));
    persistWorkspaceState(get());
  },

  resetWidgetsLayout: () => {
    set({
      widgets: DEFAULT_WIDGETS_CONFIG.map((w) => ({ ...w })),
    });
    persistWorkspaceState(get());
  },

  toggleOnboardingStep: (stepKey, forceValue) => {
    set((s) => {
      const prevOverrides = s.onboarding.manualOverrides || {};
      const currentVal = Boolean(prevOverrides[stepKey]);
      const nextVal = forceValue !== undefined ? forceValue : !currentVal;
      return {
        onboarding: {
          ...s.onboarding,
          manualOverrides: {
            ...prevOverrides,
            [stepKey]: nextVal,
          },
        },
      };
    });
    persistWorkspaceState(get());
  },

  setOnboardingDismissed: (dismissed) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        dismissed,
      },
    }));
    persistWorkspaceState(get());
  },

  setOnboardingMinimized: (minimized) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        minimized,
      },
    }));
    persistWorkspaceState(get());
  },

  markNotificationRead: (notificationId) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
    persistWorkspaceState(get());
  },

  markAllNotificationsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    persistWorkspaceState(get());
  },

  addNotification: (notificationInput) => {
    set((s) => ({
      notifications: [
        {
          ...notificationInput,
          id: `notif-${Date.now()}`,
          read: false,
          createdAt: "Ahora mismo",
        },
        ...s.notifications,
      ],
    }));
    persistWorkspaceState(get());
  },

  addAsset: (assetInput) => {
    set((s) => ({
      assets: [
        {
          ...assetInput,
          id: `asset-${Date.now()}`,
          uploadedAt: "Ahora mismo",
          usedInPosts: 0,
        },
        ...s.assets,
      ],
    }));
    persistWorkspaceState(get());
  },

  addProject: (projInput) => {
    set((s) => ({
      projects: [{ ...projInput, id: `proj-${Date.now()}` }, ...s.projects],
    }));
    persistWorkspaceState(get());
  },

  updateProject: (projectId, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)) }));
    persistWorkspaceState(get());
  },

  deleteProject: (projectId) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
    persistWorkspaceState(get());
  },

  moveProject: (projectId, status, beforeId) => {
    set((s) => ({
      projects: moveInList(s.projects, projectId, beforeId, (p) => ({ ...p, status })),
    }));
    persistWorkspaceState(get());
  },

  sendChatMessage: (channelId, text, sender = "Jair Bonilla", senderInitials = "JB") => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${Date.now()}`,
          channelId,
          sender,
          senderInitials,
          text: text.trim(),
          time,
        },
      ],
    }));
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
