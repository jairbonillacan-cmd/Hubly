import { isTaskCompleted } from "./tasks";
import type {
  ActivityEvent,
  BrandWorkspace,
  PostItem,
  AgencyTask,
  TeamMember,
  WorkspaceProfile,
} from "../types";

export type TeamProductivityPeriod = "7d" | "30d" | "90d" | "mes" | "semana" | "hoy";

interface TeamProductivityResult {
  members: EvaluatedTeamMember[];
  ranking: EvaluatedTeamMember[];
  activeMember: EvaluatedTeamMember;
  totalMembersCount: number;
  period: TeamProductivityPeriod;
}

export interface WeekdayActivityBar {
  id: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
  label: string;
  minutes: number;
  eventsCount: number;
  percent: number;
}

export interface EvaluatedTeamMember extends TeamMember {
  completedTasksCount: number;
  inProgressTasksCount: number;
  publishedPostsCount: number;
  submittedPostsCount: number;
  activeMinutes: number;
  activeTimeFormatted: string;
  avgCycleMinutes: number | null;
  avgCycleFormatted: string;
  rankPosition: number;
  weeklyActivity: WeekdayActivityBar[];
}

export interface TeamRankingRow extends EvaluatedTeamMember {
  deliverablesCount: number;
}

export interface TeamActivityRow {
  key: string;
  label: string;
  minutes: number;
  percent: number;
  statusLabel: string;
}

function formatActiveDuration(minutes: number): string {
  if (!minutes || minutes <= 1) return "menos de un minuto";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getPeriodMultiplier(period: TeamProductivityPeriod): number {
  if (period === "hoy") return 0.25;
  if (period === "7d" || period === "semana") return 0.6;
  if (period === "90d") return 2.4;
  return 1; // "30d" | "mes"
}

function buildWeeklyActivity(
  isPrimaryUser: boolean,
  completedTasksCount: number,
  publishedPostsCount: number,
  eventsCount: number
): WeekdayActivityBar[] {
  const activityBoost = completedTasksCount * 22 + publishedPostsCount * 18;
  return [
    {
      id: "lunes",
      label: "Lunes",
      minutes: isPrimaryUser ? activityBoost : 85,
      eventsCount: isPrimaryUser ? completedTasksCount : 4,
      percent: isPrimaryUser ? Math.min(100, activityBoost) : 68,
    },
    {
      id: "martes",
      label: "Martes",
      minutes: isPrimaryUser ? Math.round(activityBoost * 0.6) : 110,
      eventsCount: isPrimaryUser ? (completedTasksCount > 0 ? 1 : 0) : 5,
      percent: isPrimaryUser ? Math.min(100, Math.round(activityBoost * 0.6)) : 84,
    },
    {
      id: "miercoles",
      label: "Miércoles",
      minutes: isPrimaryUser ? Math.round(activityBoost * 0.4) : 95,
      eventsCount: isPrimaryUser ? (publishedPostsCount > 0 ? 1 : 0) : 4,
      percent: isPrimaryUser ? Math.min(100, Math.round(activityBoost * 0.4)) : 72,
    },
    {
      id: "jueves",
      label: "Jueves",
      minutes: isPrimaryUser ? Math.round(activityBoost * 0.8) : 120,
      eventsCount: isPrimaryUser ? eventsCount : 6,
      percent: isPrimaryUser ? Math.min(100, Math.round(activityBoost * 0.8)) : 90,
    },
  ];
}

function collectMemberLiveCounts(
  member: TeamMember,
  tasks: AgencyTask[],
  posts: PostItem[],
  activityEvents: ActivityEvent[]
) {
  const memberFirstName = member.name.split(" ")[0].toLowerCase();
  const memberTasks = tasks.filter(
    (t) =>
      t.assigneeId === member.id ||
      (t.assigneeName || t.assignee || "").toLowerCase().startsWith(memberFirstName)
  );
  const liveCompletedTasks = memberTasks.filter((t) => isTaskCompleted(t)).length;
  const liveInProgressTasks = memberTasks.filter((t) => !isTaskCompleted(t)).length;

  const memberPosts = posts.filter(
    (p) =>
      p.authorId === member.id ||
      (p.assignee || "").toLowerCase().startsWith(memberFirstName)
  );
  const livePublishedPosts = memberPosts.filter(
    (p) => p.status === "published" || p.statusLabel === "Publicado"
  ).length;
  const liveSubmittedPosts = memberPosts.filter(
    (p) => p.status === "pending" || p.status === "approved" || p.status === "scheduled"
  ).length;

  const memberEvents = activityEvents.filter((e) => e.memberId === member.id);
  const eventTaskCompletions = memberEvents.filter((e) => e.type === "task_completed").length;
  const eventPostPublishes = memberEvents.filter(
    // Las aprobaciones en lote antiguas se registraron como publicación por error.
    (e) => e.type === "post_published" && !e.metadata?.batchApprovedBy
  ).length;
  const eventDurationMinutes = memberEvents.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  return {
    liveCompletedTasks,
    liveInProgressTasks,
    livePublishedPosts,
    liveSubmittedPosts,
    memberEventsCount: memberEvents.length,
    eventTaskCompletions,
    eventPostPublishes,
    eventDurationMinutes,
  };
}

/** Un miembro evaluado en el periodo: tareas, posts, tiempo activo y ciclo medio. */
function evaluateTeamMember(
  member: TeamMember,
  ctx: {
    tasks: AgencyTask[];
    posts: PostItem[];
    activityEvents: ActivityEvent[];
    multiplier: number;
    hasBackend: boolean;
  }
): EvaluatedTeamMember {
  const { tasks, posts, activityEvents, multiplier, hasBackend } = ctx;
  // Las cifras iniciales de la demo no aplican a cuentas reales.
  const isPrimaryUser =
    !hasBackend && (member.id === "tm-1" || member.name.toLowerCase().startsWith("jair"));

  const {
    liveCompletedTasks,
    liveInProgressTasks,
    livePublishedPosts,
    liveSubmittedPosts,
    memberEventsCount,
    eventTaskCompletions,
    eventPostPublishes,
    eventDurationMinutes,
  } = collectMemberLiveCounts(member, tasks, posts, activityEvents);

  const baselineCompleted = isPrimaryUser
    ? liveCompletedTasks + eventTaskCompletions
    : Math.round(member.tasksCompleted * multiplier) + eventTaskCompletions;
  const completedTasksCount = isPrimaryUser
    ? baselineCompleted
    : Math.max(liveCompletedTasks, baselineCompleted);
  const inProgressTasksCount = isPrimaryUser
    ? liveInProgressTasks
    : Math.max(member.tasksInProgress, liveInProgressTasks);
  const publishedPostsCount = isPrimaryUser
    ? livePublishedPosts + eventPostPublishes
    : Math.round(member.postsPublished * multiplier) + livePublishedPosts + eventPostPublishes;

  const extraMinutesFromActions = completedTasksCount * 18 + eventPostPublishes * 25;
  const activeMinutes = isPrimaryUser
    ? (member.baseActiveMinutes || 1) + extraMinutesFromActions + Math.max(0, eventDurationMinutes - 1)
    : Math.round((member.baseActiveMinutes || 120) * multiplier) + eventDurationMinutes;

  const activeTimeFormatted = formatActiveDuration(activeMinutes);
  const avgCycleMinutes =
    completedTasksCount > 0 ? Math.max(15, Math.round(activeMinutes / completedTasksCount)) : null;
  const avgCycleFormatted = avgCycleMinutes !== null ? `${avgCycleMinutes}m` : "—";

  const weeklyActivity = buildWeeklyActivity(
    isPrimaryUser,
    completedTasksCount,
    publishedPostsCount,
    memberEventsCount
  );

  return {
    ...member,
    tasksCompleted: completedTasksCount,
    tasksInProgress: inProgressTasksCount,
    postsPublished: publishedPostsCount,
    activeTimeLabel: activeTimeFormatted,
    completedTasksCount,
    inProgressTasksCount,
    publishedPostsCount,
    submittedPostsCount: liveSubmittedPosts,
    activeMinutes,
    activeTimeFormatted,
    avgCycleMinutes,
    avgCycleFormatted,
    rankPosition: 1,
    weeklyActivity,
  };
}

function compareTeamMembersByRealMetrics(
  a: EvaluatedTeamMember,
  b: EvaluatedTeamMember
): number {
  const aDeliveries = a.completedTasksCount + a.publishedPostsCount;
  const bDeliveries = b.completedTasksCount + b.publishedPostsCount;
  if (bDeliveries !== aDeliveries) return bDeliveries - aDeliveries;
  if (b.activeMinutes !== a.activeMinutes) return b.activeMinutes - a.activeMinutes;
  const aCycle = a.avgCycleMinutes ?? Number.POSITIVE_INFINITY;
  const bCycle = b.avgCycleMinutes ?? Number.POSITIVE_INFINITY;
  return aCycle - bCycle;
}

export function selectTeamProductivity(
  members: TeamMember[],
  tasks: AgencyTask[],
  posts: PostItem[],
  activityEvents: ActivityEvent[],
  period: TeamProductivityPeriod = "30d",
  searchQuery = "",
  hasBackend = false
): TeamProductivityResult {
  const multiplier = getPeriodMultiplier(period);
  const query = searchQuery.trim().toLowerCase();

  const evaluated: EvaluatedTeamMember[] = members.map((member) =>
    evaluateTeamMember(member, { tasks, posts, activityEvents, multiplier, hasBackend })
  );

  const ranking = [...evaluated]
    .sort(compareTeamMembersByRealMetrics)
    .map((m, index) => ({ ...m, rankPosition: index + 1 }));

  const rankById = new Map(ranking.map((r) => [r.id, r.rankPosition]));
  const withRank = evaluated.map((m) => ({ ...m, rankPosition: rankById.get(m.id) || 1 }));

  const filteredMembers = query
    ? withRank.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.role.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      )
    : withRank;

  const activeMember =
    withRank.find((m) => m.id === "tm-1") || filteredMembers[0] || withRank[0];

  return {
    members: filteredMembers,
    ranking,
    activeMember,
    totalMembersCount: members.length,
    period,
  };
}

/** Sincroniza el miembro principal del equipo con el perfil activo. */
export function syncTeamWithProfile(
  team: TeamMember[],
  profile: Pick<WorkspaceProfile, "name" | "avatarInitial" | "role">
): TeamMember[] {
  return team.map((m, idx) =>
    m.id === "tm-1" || idx === 0
      ? {
          ...m,
          name: profile.name || m.name,
          avatarInitial: profile.avatarInitial || m.avatarInitial,
          role: profile.role || m.role,
        }
      : m
  );
}

/** Calcula las filas del ranking con el total de entregables del periodo. */
export function buildTeamRankingRows(ranking: EvaluatedTeamMember[]): TeamRankingRow[] {
  return ranking.map((m) => ({
    ...m,
    deliverablesCount: m.completedTasksCount + m.publishedPostsCount,
  }));
}

/** Determina las marcas asignadas al miembro inspeccionado. */
export function resolveMemberAssignedBrands(params: {
  isPrimaryOwner: boolean;
  hasCustomizedOwnerBrands: boolean;
  memberBrandIds?: string[];
  brands: BrandWorkspace[];
  activeBrand?: BrandWorkspace | null;
}): BrandWorkspace[] {
  const { isPrimaryOwner, hasCustomizedOwnerBrands, memberBrandIds, brands, activeBrand } = params;
  if (isPrimaryOwner && !hasCustomizedOwnerBrands) {
    return activeBrand ? [activeBrand] : [];
  }
  const ids = memberBrandIds ?? (activeBrand ? [activeBrand.id] : []);
  const matched = brands.filter((b) => ids.includes(b.id));
  return matched.length > 0 ? matched : brands.slice(0, 1);
}

/** Calcula la siguiente lista de ids de marca al alternar una marca (null si quedaría vacía). */
export function computeToggledMemberBrandIds(params: {
  isPrimaryOwner: boolean;
  hasCustomizedOwnerBrands: boolean;
  memberBrandIds?: string[];
  activeBrandId?: string;
  brandId: string;
}): string[] | null {
  const { isPrimaryOwner, hasCustomizedOwnerBrands, memberBrandIds, activeBrandId, brandId } = params;
  const fallbackIds = activeBrandId ? [activeBrandId] : [];
  const baseIds = isPrimaryOwner && !hasCustomizedOwnerBrands ? fallbackIds : memberBrandIds ?? fallbackIds;
  const nextIds = baseIds.includes(brandId)
    ? baseIds.filter((id) => id !== brandId)
    : [...baseIds, brandId];
  return nextIds.length > 0 ? nextIds : null;
}

/** Construye las filas de desglose de actividad semanal o mensual. */
export function buildTeamActivityRows(
  activityRange: "Semana" | "Mes",
  weeklyActivity: WeekdayActivityBar[],
  activeMinutes: number
): TeamActivityRow[] {
  if (activityRange === "Semana") {
    const fiveDays = weeklyActivity.slice(0, 5);
    return fiveDays.map((d, idx) => ({
      key: d.id,
      label: idx === fiveDays.length - 1 ? "Hoy" : d.label,
      minutes: d.minutes,
      percent: d.percent,
      statusLabel: d.minutes > 0 ? `${d.minutes}m` : "Sin actividad",
    }));
  }
  const weeks = [
    { key: "sem-1", label: "Semana 1", minutes: Math.round(activeMinutes * 0.2), percent: 25 },
    { key: "sem-2", label: "Semana 2", minutes: Math.round(activeMinutes * 0.25), percent: 35 },
    { key: "sem-3", label: "Semana 3", minutes: Math.round(activeMinutes * 0.25), percent: 35 },
    { key: "sem-4", label: "Semana actual", minutes: Math.max(0, activeMinutes - Math.round(activeMinutes * 0.7)), percent: 50 },
  ];
  return weeks.map((w) => ({
    ...w,
    statusLabel: w.minutes > 0 ? `${w.minutes}m` : "Sin actividad",
  }));
}

/** Encuentra la siguiente tarea pendiente para el miembro activo o del equipo. */
export function findNextPendingMemberTask(
  tasks: AgencyTask[],
  memberId: string,
  memberName: string
): AgencyTask | undefined {
  const lowerName = memberName.toLowerCase();
  return (
    tasks.find(
      (t) =>
        t.status !== "done" &&
        (t.assigneeId === memberId || t.assignee.toLowerCase().includes(lowerName))
    ) ?? tasks.find((t) => t.status !== "done")
  );
}
