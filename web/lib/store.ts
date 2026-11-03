"use client";

import { create } from "zustand";
import { INITIAL_WORKSPACE_DATA } from "./seed-data";
import type {
  AccountCommitment,
  ActivityEvent,
  AgencyInfo,
  AgencyTask,
  BrandCore,
  BrandProject,
  BrandWorkspace,
  AutomationRule,
  ContentIdea,
  CustomCommitmentMetric,
  Lead,
  LeadStage,
  Quote,
  DashboardWidgetConfig,
  DashboardWidgetId,
  DashboardWidgetSpan,
  HublyWorkspaceData,
  MediaAsset,
  NotebookItem,
  PeriodCommitmentSnapshot,
  PostExtrasPatch,
  PostStatus,
  SocialNetwork,
  SocialPost,
  TeamInvitation,
  TeamMember,
  WorkspaceNotification,
  WorkspaceProfile,
} from "./types";
import { createUiSlice } from "./store-slices/ui-slice";
import { createSyncSlice } from "./store-slices/sync-slice";
import { createBrandsSlice } from "./store-slices/brands-slice";
import { createPostsSlice } from "./store-slices/posts-slice";
import { createCrmSlice } from "./store-slices/crm-slice";
import { createTasksSlice } from "./store-slices/tasks-slice";
import { createTeamSlice } from "./store-slices/team-slice";
import { createWorkspaceSlice } from "./store-slices/workspace-slice";

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

  ...createUiSlice(set, get),
  ...createSyncSlice(set, get),
  ...createBrandsSlice(set, get),
  ...createPostsSlice(set, get),
  ...createCrmSlice(set, get),
  ...createTasksSlice(set, get),
  ...createTeamSlice(set, get),
  ...createWorkspaceSlice(set, get),
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
