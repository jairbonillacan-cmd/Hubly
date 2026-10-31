import type { DashboardWidgetConfig } from "./types";
import {
  createSeedWorkspaceData,
  DEFAULT_AGENCY,
  DEFAULT_NOTEBOOKS,
  DEFAULT_ONBOARDING,
  DEFAULT_PROFILE,
  DEFAULT_WIDGETS_CONFIG,
  REFERENCE_FIXTURE_CLOCK,
} from "./seed-data";
import type {
  BrandWorkspace,
  HublyWorkspaceData,
  SocialNetwork,
  SocialPost,
  TaskItem,
  TeamMember,
} from "./types";

export const WORKSPACE_STORAGE_PREFIX = "hubly:workspace:v3:";
export const LEGACY_STORAGE_KEYS = [
  "hubly-workspace-v2",
  "henry-workspace-v1",
  "hubly-workspace-storage-v1",
] as const;

function mergeMissingWidgets(saved: DashboardWidgetConfig[]): DashboardWidgetConfig[] {
  const missing = DEFAULT_WIDGETS_CONFIG.filter((d) => !saved.some((w) => w.id === d.id));
  return [...saved, ...missing.map((d) => ({ ...d, order: saved.length + d.order }))];
}

export function sanitizeWorkspaceId(rawId?: string | null): string {
  if (!rawId || typeof rawId !== "string") return "default";
  const cleaned = rawId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "default";
}

export function getWorkspaceStorageKey(workspaceId = "default"): string {
  return `${WORKSPACE_STORAGE_PREFIX}${sanitizeWorkspaceId(workspaceId)}`;
}

export function resolveWorkspaceIdFromUrl(search?: string): string {
  const rawSearch =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
      ? window.location.search
      : "";
  if (!rawSearch) return "default";
  try {
    const params = new URLSearchParams(rawSearch);
    const fromParam = params.get("workspace") || params.get("workspaceId");
    return sanitizeWorkspaceId(fromParam);
  } catch {
    return "default";
  }
}

export function isReferenceFixtureUrl(search?: string): boolean {
  const rawSearch =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
      ? window.location.search
      : "";
  if (!rawSearch) return false;
  try {
    const params = new URLSearchParams(rawSearch);
    return params.get("fixture") === "reference";
  } catch {
    return false;
  }
}

export function resolveTestClockFromUrl(search?: string): string | null {
  const rawSearch =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
      ? window.location.search
      : "";
  if (!rawSearch) return null;
  try {
    const params = new URLSearchParams(rawSearch);
    if (params.get("fixture") === "reference") {
      return REFERENCE_FIXTURE_CLOCK;
    }
    const clockParam = params.get("clock");
    if (clockParam && !isNaN(new Date(clockParam).getTime())) {
      return clockParam;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reemplaza recursivamente referencias heredadas de "Henry" por "Hubly"
 * durante la migración de versiones previas del almacenamiento.
 */
export function sanitizeHenryToHubly<T>(input: T): T {
  if (typeof input === "string") {
    return input
      .replace(/https?:\/\/(www\.)?henry\.cm/gi, "https://hubly.cm")
      .replace(/\bHenry\b/g, "Hubly")
      .replace(/\bhenry\b/g, "hubly") as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeHenryToHubly(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      out[key] = sanitizeHenryToHubly(val);
    }
    return out as T;
  }
  return input;
}

function normalizeBrand(
  brand: Partial<BrandWorkspace>,
  seedBrand?: BrandWorkspace
): BrandWorkspace {
  const fallback = seedBrand || createSeedWorkspaceData("default").brands[1];
  const connectedNetworks =
    Array.isArray(brand.connectedNetworks) && brand.connectedNetworks.length > 0
      ? brand.connectedNetworks
      : Array.isArray(brand.Networks) && brand.Networks.length > 0
      ? brand.Networks
      : fallback.connectedNetworks;

  const hasPaidAds =
    typeof brand.hasPaidAds === "boolean"
      ? brand.hasPaidAds
      : (brand.adBudget ?? fallback.adBudget) > 0;

  const seedCommitments = fallback.commitments;
  const rawCommitments = brand.commitments;

  const postsCommitted =
    rawCommitments?.postsCommitted ??
    brand.monthlyPostTarget ??
    seedCommitments.postsCommitted;
  const postsCompleted =
    rawCommitments?.postsCompleted ?? seedCommitments.postsCompleted;
  const StoriesCommitted =
    rawCommitments?.StoriesCommitted ??
    rawCommitments?.storiesCommitted ??
    seedCommitments.StoriesCommitted;
  const StoriesCompleted =
    rawCommitments?.StoriesCompleted ??
    rawCommitments?.storiesCompleted ??
    seedCommitments.StoriesCompleted;
  const reelsCommitted =
    rawCommitments?.reelsCommitted ?? seedCommitments.reelsCommitted;
  const reelsCompleted =
    rawCommitments?.reelsCompleted ?? seedCommitments.reelsCompleted;
  const adCampaignsCommitted =
    rawCommitments?.adCampaignsCommitted ?? seedCommitments.adCampaignsCommitted;
  const adCampaignsCompleted =
    rawCommitments?.adCampaignsCompleted ?? seedCommitments.adCampaignsCompleted;

  return {
    ...fallback,
    ...brand,
    id: brand.id || fallback.id,
    name: brand.name || fallback.name,
    slug: brand.slug || fallback.slug,
    handle:
      brand.handle ||
      (brand.bioLink?.handle ? `@${brand.bioLink.handle.replace(/^@/, "")}` : fallback.handle),
    shareToken: brand.shareToken || fallback.shareToken,
    initials: brand.initials || fallback.initials,
    initial: brand.initial || (brand.initials || fallback.initials).charAt(0).toUpperCase(),
    color: brand.color || fallback.color,
    avatarBg: brand.avatarBg || fallback.avatarBg,
    avatarColor: brand.avatarColor || fallback.avatarColor,
    industry: brand.industry || fallback.industry,
    city: brand.city || fallback.city,
    connectedNetworks,
    Networks: connectedNetworks,
    monthlyPostTarget: brand.monthlyPostTarget ?? postsCommitted,
    monthlyBudget: brand.monthlyBudget ?? fallback.monthlyBudget,
    adBudget: brand.adBudget ?? fallback.adBudget,
    hasPaidAds,
    paidAdsLabel: hasPaidAds ? "con pauta" : "sin pauta",
    healthStatus: brand.healthStatus || fallback.healthStatus,
    healthScore: brand.healthScore ?? fallback.healthScore,
    commitments: {
      period: rawCommitments?.period || "mes_actual",
      postsCommitted,
      postsCompleted,
      StoriesCommitted,
      StoriesCompleted,
      storiesCommitted: StoriesCommitted,
      storiesCompleted: StoriesCompleted,
      reelsCommitted,
      reelsCompleted,
      adCampaignsCommitted,
      adCampaignsCompleted,
      hasDeclaredCommitments:
        rawCommitments?.hasDeclaredCommitments ??
        seedCommitments.hasDeclaredCommitments,
      customMetrics:
        rawCommitments?.customMetrics || seedCommitments.customMetrics || [],
      periodHistory: {
        mes_actual: {
          ...seedCommitments.periodHistory.mes_actual,
          ...(rawCommitments?.periodHistory?.mes_actual || {}),
          postsCommitted,
          postsCompleted,
          StoriesCommitted,
          StoriesCompleted,
          storiesCommitted: StoriesCommitted,
          storiesCompleted: StoriesCompleted,
          reelsCommitted,
          reelsCompleted,
          adCampaignsCommitted,
          adCampaignsCompleted,
        },
        mes_anterior: {
          ...seedCommitments.periodHistory.mes_anterior,
          ...(rawCommitments?.periodHistory?.mes_anterior || {}),
        },
        trimestre: {
          ...seedCommitments.periodHistory.trimestre,
          ...(rawCommitments?.periodHistory?.trimestre || {}),
        },
      },
    },
    core: {
      ...fallback.core,
      ...(brand.core || {}),
    },
    bioLink: {
      ...fallback.bioLink,
      ...(brand.bioLink || {}),
    },
  };
}

function normalizeTask(task: Partial<TaskItem>): TaskItem {
  const completed =
    typeof task.completed === "boolean"
      ? task.completed
      : task.status === "done" || task.status === "completada";
  const assigneeName = task.assigneeName || task.assignee || "Jair";
  const assigneeInitial =
    task.assigneeInitial || assigneeName.charAt(0).toUpperCase() || "J";
  return {
    id: task.id || `task-${Date.now()}`,
    brandId: task.brandId || "brand-min",
    title: task.title || "Tarea sin título",
    description: task.description,
    dueLabel: task.dueLabel || (completed ? "Completada" : "Hoy"),
    dueDate: task.dueDate || "2026-10-30",
    dueBucket: task.dueBucket,
    assignee: task.assignee || assigneeName,
    assigneeId: task.assigneeId || "tm-1",
    assigneeName,
    assigneeInitial,
    listName: task.listName || "Primeros pasos",
    listId: task.listId || "list-primeros-pasos",
    status: task.status || (completed ? "done" : "todo"),
    priority: task.priority || "alta",
    completed,
    completedAt: task.completedAt,
    estimatedMinutes: task.estimatedMinutes ?? 20,
    spentMinutes: task.spentMinutes ?? (completed ? 20 : 0),
    highlighted: task.highlighted ?? false,
    tags:
      Array.isArray(task.tags) && task.tags.length > 0
        ? task.tags
        : [task.listName || "Primeros pasos"],
  };
}

function normalizePost(post: Partial<SocialPost>): SocialPost {
  const networks: SocialNetwork[] =
    Array.isArray(post.networks) && post.networks.length > 0
      ? post.networks
      : post.network
      ? [post.network]
      : ["Instagram"];
  const status = post.status || "pending";
  const statusLabel =
    post.statusLabel ||
    (status === "draft"
      ? "Borrador"
      : status === "pending"
      ? "En aprobación"
      : status === "changes"
      ? "Requiere cambios"
      : status === "published"
      ? "Publicado"
      : "Programado");
  return {
    id: post.id || `post-${Date.now()}`,
    brandId: post.brandId || "brand-min",
    title: post.title || "Publicación",
    caption: post.caption || "",
    network: post.network || networks[0],
    networks,
    format: post.format || "Carrusel",
    cover: post.cover || "cup",
    scheduledDate: post.scheduledDate || "2026-11-04",
    scheduledTime: post.scheduledTime || "12:00",
    status,
    statusLabel,
    assignee: post.assignee || "Jair B.",
    authorId: post.authorId || "tm-1",
    approverName: post.approverName,
    pillar: post.pillar || "General",
    metrics: post.metrics,
    comments: Array.isArray(post.comments) ? post.comments : [],
    mediaUrl: post.mediaUrl,
    notifyOnPublish: post.notifyOnPublish,
    notes: post.notes,
    todos: post.todos,
    documents: post.documents,
    chat: post.chat,
    activity: post.activity,
  };
}

function normalizeMember(member: Partial<TeamMember>): TeamMember {
  const initials =
    member.initials ||
    member.avatarInitial ||
    (member.name || "JB")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return {
    id: member.id || `tm-${Date.now()}`,
    name: member.name || "Miembro",
    initials,
    avatarInitial: member.avatarInitial || initials.charAt(0),
    avatarColor: member.avatarColor || "#4F46E5",
    role: member.role || "Miembro",
    email: member.email || "equipo@agencia.demo",
    status: member.status || "Activo",
    baseActiveMinutes: member.baseActiveMinutes ?? 120,
    brandIds: member.brandIds || ["brand-min"],
    brandsCount: member.brandsCount ?? 1,
    tasksCompleted: member.tasksCompleted ?? 0,
    tasksInProgress: member.tasksInProgress ?? 1,
    postsPublished: member.postsPublished ?? 0,
    activeTimeLabel: member.activeTimeLabel || "menos de un minuto",
    points: member.points ?? 53,
  };
}

export function normalizeWorkspacePayload(
  rawInput: Partial<HublyWorkspaceData> | null | undefined,
  workspaceId = "default"
): HublyWorkspaceData {
  const cleanId = sanitizeWorkspaceId(workspaceId);
  const seed = createSeedWorkspaceData(cleanId);
  if (!rawInput || typeof rawInput !== "object") {
    return seed;
  }

  // Envoltorio de Zustand persist { state: { ... }, version: 0 } si existiera
  const unwrapped =
    "state" in rawInput &&
    rawInput.state &&
    typeof rawInput.state === "object"
      ? (rawInput.state as Partial<HublyWorkspaceData>)
      : rawInput;

  const sanitized = sanitizeHenryToHubly(unwrapped);

  const seedBrandsById = new Map(seed.brands.map((b) => [b.id, b]));
  const brands =
    Array.isArray(sanitized.brands) && sanitized.brands.length > 0
      ? sanitized.brands.map((b) => normalizeBrand(b, seedBrandsById.get(b.id)))
      : seed.brands;

  // Respetamos 100% la marca activa guardada por el usuario si existe en brands
  const requestedActiveBrandId = sanitized.activeBrandId;
  const activeBrandId =
    requestedActiveBrandId && brands.some((b) => b.id === requestedActiveBrandId)
      ? requestedActiveBrandId
      : brands[0]?.id || "brand-min";

  const tasks =
    Array.isArray(sanitized.tasks) && sanitized.tasks.length > 0
      ? sanitized.tasks.map((t) => normalizeTask(t))
      : seed.tasks;

  const posts =
    Array.isArray(sanitized.posts) && sanitized.posts.length > 0
      ? sanitized.posts.map((p) => normalizePost(p))
      : seed.posts;

  const team =
    Array.isArray(sanitized.team) && sanitized.team.length > 0
      ? sanitized.team.map((m) => normalizeMember(m))
      : seed.team;

  const agencyName =
    sanitized.agency?.name || sanitized.agencyName || seed.agencyName;

  return {
    workspaceId: cleanId,
    agencyName,
    profile: {
      ...DEFAULT_PROFILE,
      ...(sanitized.profile || {}),
    },
    agency: {
      ...DEFAULT_AGENCY,
      ...(sanitized.agency || {}),
      name: agencyName,
    },
    testClock: {
      fixedIsoNow: sanitized.testClock?.fixedIsoNow ?? null,
    },
    activeBrandId,
    brands,
    posts,
    ideas: Array.isArray(sanitized.ideas) ? sanitized.ideas : [],
    tasks,
    notebooks:
      Array.isArray(sanitized.notebooks) && sanitized.notebooks.length > 0
        ? sanitized.notebooks
        : DEFAULT_NOTEBOOKS.map((n) => ({ ...n })),
    assets:
      Array.isArray(sanitized.assets) && sanitized.assets.length > 0
        ? sanitized.assets
        : seed.assets,
    projects:
      Array.isArray(sanitized.projects) && sanitized.projects.length > 0
        ? sanitized.projects
        : seed.projects,
    ads:
      Array.isArray(sanitized.ads) && sanitized.ads.length > 0
        ? sanitized.ads
        : seed.ads,
    channels:
      Array.isArray(sanitized.channels) && sanitized.channels.length > 0
        ? sanitized.channels
        : seed.channels,
    messages:
      Array.isArray(sanitized.messages) && sanitized.messages.length > 0
        ? sanitized.messages
        : seed.messages,
    team,
    invitations: Array.isArray(sanitized.invitations)
      ? sanitized.invitations
      : [],
    activityEvents:
      Array.isArray(sanitized.activityEvents) &&
      sanitized.activityEvents.length > 0
        ? sanitized.activityEvents
        : seed.activityEvents,
    notifications: Array.isArray(sanitized.notifications)
      ? sanitized.notifications
      : [],
    widgets:
      Array.isArray(sanitized.widgets) && sanitized.widgets.length > 0
        ? mergeMissingWidgets(sanitized.widgets)
        : DEFAULT_WIDGETS_CONFIG.map((w) => ({ ...w })),
    onboarding: {
      ...DEFAULT_ONBOARDING,
      ...(sanitized.onboarding || {}),
      manualOverrides: {
        ...(sanitized.onboarding?.manualOverrides || {}),
      },
    },
    dismissedRecommendationIds: Array.isArray(
      sanitized.dismissedRecommendationIds
    )
      ? sanitized.dismissedRecommendationIds
      : [],
    appliedRecommendationsMap:
      sanitized.appliedRecommendationsMap &&
      typeof sanitized.appliedRecommendationsMap === "object"
        ? sanitized.appliedRecommendationsMap
        : {},
  };
}

export const normalizeWorkspaceData = normalizeWorkspacePayload;

export function hasStoredWorkspaceInV3(workspaceId = "default"): boolean {
  if (typeof window === "undefined") return false;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  try {
    return Boolean(window.localStorage.getItem(getWorkspaceStorageKey(cleanId)));
  } catch {
    return false;
  }
}

export function loadWorkspaceFromStorage(
  workspaceId = "default"
): HublyWorkspaceData | null {
  if (typeof window === "undefined") return null;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  const v3Key = getWorkspaceStorageKey(cleanId);

  try {
    const rawV3 = window.localStorage.getItem(v3Key);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as Partial<HublyWorkspaceData>;
      return normalizeWorkspacePayload(parsed, cleanId);
    }

    // Si es el workspace "default" y aún no existe v3, migrar automáticamente de v2 / v1
    if (cleanId === "default") {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacyKey);
        if (legacyRaw) {
          const parsedLegacy = JSON.parse(legacyRaw) as Partial<HublyWorkspaceData>;
          const migrated = normalizeWorkspacePayload(parsedLegacy, "default");
          window.localStorage.setItem(v3Key, JSON.stringify(migrated));
          return migrated;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function saveWorkspaceToStorage(
  workspaceId: string,
  data: HublyWorkspaceData
): void {
  if (typeof window === "undefined") return;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  const v3Key = getWorkspaceStorageKey(cleanId);
  try {
    const payload = normalizeWorkspacePayload(
      { ...data, workspaceId: cleanId },
      cleanId
    );
    window.localStorage.setItem(v3Key, JSON.stringify(payload));
  } catch {
    // Ignorar errores de cuota de almacenamiento en modo privado
  }
}

export function clearWorkspaceStorage(workspaceId = "default"): void {
  if (typeof window === "undefined") return;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  try {
    window.localStorage.removeItem(getWorkspaceStorageKey(cleanId));
    if (cleanId === "default") {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        window.localStorage.removeItem(legacyKey);
      }
    }
  } catch {}
}

export function buildReferenceFixtureWorkspace(
  workspaceId = "default"
): HublyWorkspaceData {
  const cleanId = sanitizeWorkspaceId(workspaceId);
  return createSeedWorkspaceData(cleanId, { referenceFixture: true });
}

export async function fetchWorkspaceFromApi(
  workspaceId = "default"
): Promise<HublyWorkspaceData | null> {
  if (typeof window === "undefined") return null;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  try {
    const res = await fetch(
      `/api/workspace?workspaceId=${encodeURIComponent(cleanId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Partial<HublyWorkspaceData>;
    if (!json || !Array.isArray(json.brands) || json.brands.length === 0) {
      return null;
    }
    return normalizeWorkspacePayload(json, cleanId);
  } catch {
    return null;
  }
}

export async function pushWorkspaceToApi(
  workspaceId: string,
  data: HublyWorkspaceData
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const cleanId = sanitizeWorkspaceId(workspaceId);
  try {
    const res = await fetch(
      `/api/workspace?workspaceId=${encodeURIComponent(cleanId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workspaceId: cleanId }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
