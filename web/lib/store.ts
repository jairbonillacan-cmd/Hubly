"use client";

import { create } from "zustand";
import { DEFAULT_WIDGETS_CONFIG, INITIAL_WORKSPACE_DATA } from "./seed-data";
import { selectAccountRecommendations } from "./domain-selectors";
import { POST_STATUS_LABEL } from "./labels";
import { createActivityItem } from "./domain/activity";
import { withPostLog } from "./domain/posts";
import { createSessionSlice, type SessionSlice } from "./store/session.slice";
import { createUiSlice, type UiSlice } from "./store/ui.slice";
import { persistWorkspaceState } from "./store/sync";
import { createCrmSlice, type CrmSlice } from "./store/crm.slice";
import { createAutomationsSlice, type AutomationsSlice } from "./store/automations.slice";
import { createAgentsSlice, type AgentsSlice } from "./store/agents.slice";
import { createNotebooksSlice, type NotebooksSlice } from "./store/notebooks.slice";
import { createAssetsSlice, type AssetsSlice } from "./store/assets.slice";
import { createProjectsSlice, type ProjectsSlice } from "./store/projects.slice";
import { localIsoDate } from "./date";
import { nextOccurrence, toggleReaction } from "./chat";
import { CHAT_NOTIFICATION_PREFIX, chatRemote, newChatId, useChatPresence } from "./chat-live";
import { moveInList } from "./use-kanban-drag";
import { backendEnabled } from "./supabase/config";
import { currentAgencyId } from "./live-workspace";
import type {
  AccountCommitment,
  ActivityEvent,
  AgencyTask,
  BrandCore,
  ChatAttachment,
  ChatChannel,
  ChatMessage,
  ChatReminder,
  ChatScheduledMessage,
  BrandWorkspace,
  AutomationTrigger,
  ContentIdea,
  CustomCommitmentMetric,
  DashboardMetricId,
  DashboardWidgetConfig,
  DashboardWidgetId,
  DashboardWidgetSpan,
  HublyWorkspaceData,
  PeriodCommitmentSnapshot,
  PostExtrasPatch,
  PostStatus,
  SocialNetwork,
  SocialPost,
  TeamInvitation,
  TeamMember,
  WorkspaceNotification,
} from "./types";

type CommitmentPeriodKey = "mes_actual" | "mes_anterior" | "trimestre";

type OnboardingStepKey =
  | "redes"
  | "post"
  | "aprueba"
  | "equipo"
  | "brandCreatedOrSelected"
  | "postCreatedOrScheduled"
  | "taskCreatedOrCompleted"
  | "teamCheckedOrInvited";

type AddBrandInput = {
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

type AddTaskInput = Omit<
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

/** Lo que aún vive en este archivo. Las demás claves llegan por los slices. */
interface StoreCoreState extends HublyWorkspaceData {
  teamMembers: TeamMember[];
  dashboardWidgets: DashboardWidgetConfig[];
  // UI & Modal Actions
  setActiveBrand: (brandId: string) => void;

  // Profile & Agency Actions

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

  // Task Actions
  addTask: (task: AddTaskInput) => void;
  updateTask: (taskId: string, patch: Partial<AgencyTask>) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, status: "todo" | "in_progress" | "done", beforeId: string | null) => void;
  addTaskList: (brandId: string, name: string) => void;
  renameTaskList: (brandId: string, oldName: string, newName: string) => void;
  deleteTaskList: (brandId: string, name: string) => void;

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
  sendChatMessage: (
    channelId: string,
    text: string,
    sender?: string,
    senderInitials?: string,
    options?: { parentId?: string; attachment?: ChatAttachment }
  ) => void;
  editChatMessage: (messageId: string, text: string) => void;
  /** Borra el mensaje y sus respuestas. */
  deleteChatMessage: (messageId: string) => void;
  toggleChatReaction: (messageId: string, emoji: string, who: string) => void;
  toggleChatPin: (messageId: string) => void;
  markChatRead: (channelId: string) => void;
  addChatChannel: (input: Pick<ChatChannel, "name" | "type"> & Partial<ChatChannel>) => ChatChannel;
  updateChatChannel: (channelId: string, patch: Partial<Pick<ChatChannel, "name" | "description" | "archived" | "emoji" | "memberIds">>) => void;
  setChatPreference: (channelId: string, patch: Partial<Pick<ChatChannel, "muted" | "listPinned" | "hidden">>) => void;
  /** Borra el canal con sus mensajes y lo que tenía en cola. */
  deleteChatChannel: (channelId: string) => void;
  scheduleChatMessage: (input: Omit<ChatScheduledMessage, "id">) => void;
  cancelChatScheduled: (id: string) => void;
  addChatReminder: (input: Omit<ChatReminder, "id">) => void;
  /** Envía lo programado y avisa los recordatorios vencidos de esta persona. */
  flushChatQueue: (now: number) => void;
}

export type HublyStoreState = StoreCoreState &
  SessionSlice &
  UiSlice &
  CrmSlice &
  AutomationsSlice &
  AgentsSlice &
  NotebooksSlice &
  AssetsSlice &
  ProjectsSlice;



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

export const useHublyStore = create<HublyStoreState>()((...a) => {
  const [set, get] = a;
  return {
  ...INITIAL_WORKSPACE_DATA, // Siempre primero: aporta los datos guardados
  ...createSessionSlice(...a),
  ...createUiSlice(...a),
  ...createCrmSlice(...a),
  ...createAutomationsSlice(...a),
  ...createAgentsSlice(...a),
  ...createNotebooksSlice(...a),
  ...createAssetsSlice(...a),
  ...createProjectsSlice(...a),
  teamMembers: INITIAL_WORKSPACE_DATA.team,
  dashboardWidgets: INITIAL_WORKSPACE_DATA.widgets.map((w) => ({
    ...w,
    enabled: w.visible,
  })),

  setActiveBrand: (brandId) => {
    if (backendEnabled) {
      try {
        localStorage.setItem(`hubly:marca-activa:${currentAgencyId()}`, brandId);
      } catch { /* Almacenamiento lleno o bloqueado: se sigue sin él. */ }
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

  setActiveNotebookId: (notebookId) => set({ activeNotebookId: notebookId }),

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
        postInput.statusLabel || POST_STATUS_LABEL[postInput.status] || "Borrador";
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
            statusLabel: POST_STATUS_LABEL[status] || p.statusLabel,
            comments: nextComments,
          },
          `Cambió el estado a «${POST_STATUS_LABEL[status] || status}»`,
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
    if (notificationId.startsWith(CHAT_NOTIFICATION_PREFIX) && useChatPresence.getState().serverFeatures) chatRemote()?.markNotificationRead(notificationId);
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



  sendChatMessage: (channelId, text, sender = "Jair Bonilla", senderInitials = "JB", options) => {
    const body = text.trim();
    if (!body && !options?.attachment) return;
    const now = new Date();
    const remote = chatRemote();
    const message: ChatMessage = {
      id: remote ? newChatId() : `msg-${now.getTime()}-${get().messages.length}`,
      channelId,
      sender,
      senderInitials,
      text: body,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      createdAt: now.getTime(),
      ...(remote && get().profile?.id ? { senderId: get().profile.id } : {}),
      ...(remote && get().profile?.avatarUrl ? { senderAvatar: get().profile.avatarUrl } : {}),
      ...(options?.parentId ? { parentId: options.parentId } : {}),
      ...(options?.attachment ? { attachment: options.attachment } : {}),
    };
    set((s) => ({ messages: [...s.messages, message] }));
    if (remote) remote.sendMessage(message);
    else persistWorkspaceState(get());
  },

  editChatMessage: (messageId, text) => {
    const body = text.trim();
    if (!body) return;
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, text: body, editedAt: Date.now() } : m)),
    }));
    chatRemote()?.editMessage(messageId, body);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  deleteChatMessage: (messageId) => {
    set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId && m.parentId !== messageId) }));
    chatRemote()?.deleteMessage(messageId);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  toggleChatReaction: (messageId, emoji, who) => {
    const had = get().messages.find((m) => m.id === messageId)?.reactions?.[emoji]?.includes(who) ?? false;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, reactions: toggleReaction(m.reactions, emoji, who) } : m
      ),
    }));
    chatRemote()?.react(messageId, emoji, !had, who);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  toggleChatPin: (messageId) => {
    const pinned = !get().messages.find((m) => m.id === messageId)?.pinned;
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, pinned } : m)),
    }));
    chatRemote()?.pin(messageId, pinned);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  markChatRead: (channelId) => {
    chatRemote()?.markRead(channelId);
    if (!get().channels.some((c) => c.id === channelId && c.unread > 0)) return;
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, unread: 0, mentioned: false } : c)) }));
    if (!chatRemote()) persistWorkspaceState(get());
  },

  addChatChannel: (input) => {
    const remote = chatRemote();
    const channel: ChatChannel = { unread: 0, ...input, id: remote ? newChatId() : `ch-${Date.now()}` };
    set((s) => ({ channels: [...s.channels, channel] }));
    if (remote) remote.addChannel(channel);
    else persistWorkspaceState(get());
    return channel;
  },

  updateChatChannel: (channelId, patch) => {
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)) }));
    chatRemote()?.updateChannel(channelId, patch);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  setChatPreference: (channelId, patch) => {
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)) }));
    chatRemote()?.setPreference(channelId, {
      ...(patch.muted !== undefined ? { muted: patch.muted } : {}),
      ...(patch.listPinned !== undefined ? { pinned: patch.listPinned } : {}),
      ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
    });
  },

  deleteChatChannel: (channelId) => {
    set((s) => ({
      channels: s.channels.filter((c) => c.id !== channelId),
      messages: s.messages.filter((m) => m.channelId !== channelId),
      chatScheduled: (s.chatScheduled || []).filter((q) => q.channelId !== channelId),
      chatReminders: (s.chatReminders || []).filter((r) => r.channelId !== channelId),
    }));
    chatRemote()?.deleteChannel(channelId);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  scheduleChatMessage: (input) => {
    const remote = chatRemote();
    const item = { ...input, id: remote ? newChatId() : `cola-${Date.now()}` };
    set((s) => ({ chatScheduled: [...(s.chatScheduled || []), item] }));
    if (remote) remote.schedule(item);
    else persistWorkspaceState(get());
  },

  cancelChatScheduled: (id) => {
    set((s) => ({ chatScheduled: (s.chatScheduled || []).filter((q) => q.id !== id) }));
    chatRemote()?.cancelScheduled(id);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  addChatReminder: (input) => {
    const remote = chatRemote();
    const item = { ...input, id: remote ? newChatId() : `rec-${Date.now()}` };
    set((s) => ({ chatReminders: [...(s.chatReminders || []), item] }));
    if (remote) remote.addReminder(item);
    else persistWorkspaceState(get());
  },

  flushChatQueue: (now) => {
    const { profile, chatScheduled = [], chatReminders = [] } = get();
    const mine = <T extends { authorId: string }>(item: T) => item.authorId === profile?.id;
    const dueMessages = chatScheduled.filter((q) => mine(q) && q.sendAt <= now);
    const dueReminders = chatReminders.filter((r) => mine(r) && r.remindAt <= now);
    if (dueMessages.length === 0 && dueReminders.length === 0) return;
    const remote = chatRemote();
    // Con tablas, el servidor envía cada uno una sola vez aunque haya varias sesiones abiertas.
    // Con la 0009, los recordatorios también los resuelve el servidor y llegan como aviso propio.
    const serverReminders = Boolean(remote) && useChatPresence.getState().serverFeatures;
    if (remote && (dueMessages.length > 0 || (serverReminders && dueReminders.length > 0))) remote.flushDue();
    if (serverReminders && dueMessages.length === 0) {
      set((s) => ({ chatReminders: (s.chatReminders || []).filter((r) => !dueReminders.some((d) => d.id === r.id)) }));
      return;
    }
    if (!remote) for (const q of dueMessages) get().sendChatMessage(q.channelId, q.text, q.sender, q.senderInitials);
    for (const r of serverReminders ? [] : dueReminders) {
      get().addNotification({
        title: "Recordatorio del chat",
        body: r.text,
        kind: "sistema",
        actionUrl: `/chat?c=${encodeURIComponent(r.channelId)}&m=${encodeURIComponent(r.messageId)}`,
      });
    }
    const handled = new Set(dueMessages.map((q) => q.id));
    const remindedIds = new Set(dueReminders.map((r) => r.id));
    set((s) => ({
      chatScheduled: (s.chatScheduled || []).flatMap((q) => {
        if (!handled.has(q.id) || remote) return [q];
        return q.repeat === "none" ? [] : [{ ...q, sendAt: nextOccurrence(q.sendAt, q.repeat, now) }];
      }),
      chatReminders: (s.chatReminders || []).filter((r) => !remindedIds.has(r.id)),
    }));
    if (remote) {
      if (!serverReminders) for (const r of dueReminders) remote.removeReminder(r.id);
    }
    else persistWorkspaceState(get());
  },

  };
});

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
