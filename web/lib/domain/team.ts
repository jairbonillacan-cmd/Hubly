import { isTaskCompleted } from "./tasks";
import type {
  ActivityEvent,
  PostItem,
  TaskItem,
  TeamMember,
} from "../types";

export type TeamProductivityPeriod = "7d" | "30d" | "90d" | "mes" | "semana" | "hoy";

interface TeamProductivityResult {
  members: EvaluatedTeamMember[];
  ranking: EvaluatedTeamMember[];
  activeMember: EvaluatedTeamMember;
  totalMembersCount: number;
  period: TeamProductivityPeriod;
  totalAchievementsCatalog: number;
}

export interface TeamAchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  xpReward: number;
  category: "productividad" | "contenido" | "equipo" | "racha";
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
  avgCycleFormatted: string;
  efficiencyScore: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  levelProgressPercent: number;
  streakDays: number;
  bestStreakDays: number;
  rankPosition: number;
  achievements: TeamAchievementItem[];
  unlockedAchievementsCount: number;
  totalAchievementsCatalog: number;
  weeklyActivity: WeekdayActivityBar[];
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

/** Un miembro evaluado en el periodo: tareas, posts, actividad y logros. */
function evaluateTeamMember(
  member: TeamMember,
  idx: number,
  ctx: {
    tasks: TaskItem[];
    posts: PostItem[];
    activityEvents: ActivityEvent[];
    multiplier: number;
    hasBackend: boolean;
  }
): EvaluatedTeamMember {
  const { tasks, posts, activityEvents, multiplier, hasBackend } = ctx;
    // Las cifras iniciales de la demo no aplican a cuentas reales.
    const isPrimaryUser =
      !hasBackend &&
      (member.id === "tm-1" || member.name.toLowerCase().startsWith("jair"));

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
      (p) =>
        p.status === "pending" ||
        p.status === "approved" ||
        p.status === "scheduled"
    ).length;

    const memberEvents = activityEvents.filter((e) => e.memberId === member.id);
    const eventTaskCompletions = memberEvents.filter(
      (e) => e.type === "task_completed"
    ).length;
    const eventPostPublishes = memberEvents.filter(
      // Las aprobaciones en lote antiguas se registraron como publicación por error.
      (e) => e.type === "post_published" && !e.metadata?.batchApprovedBy
    ).length;
    const eventDurationMinutes = memberEvents.reduce(
      (sum, e) => sum + (e.durationMinutes || 0),
      0
    );

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
      : Math.round(member.postsPublished * multiplier) +
        livePublishedPosts +
        eventPostPublishes;

    const extraMinutesFromActions =
      completedTasksCount * 18 + eventPostPublishes * 25;
    const activeMinutes = isPrimaryUser
      ? (member.baseActiveMinutes || 1) + extraMinutesFromActions + Math.max(0, eventDurationMinutes - 1)
      : Math.round((member.baseActiveMinutes || 120) * multiplier) +
        eventDurationMinutes;

    const activeTimeFormatted = formatActiveDuration(activeMinutes);
    const avgCycleFormatted =
      completedTasksCount > 0
        ? `${Math.max(15, Math.round(activeMinutes / completedTasksCount))}m`
        : "—";

    const baseXp = member.points || 0;
    const xp =
      Math.round(baseXp * (isPrimaryUser ? 1 : multiplier)) +
      completedTasksCount * 25 +
      publishedPostsCount * 30 +
      memberEvents.length * 5;

    const level = Math.max(1, Math.floor(xp / 100) + 1);
    const nextLevelThreshold = level * 100;
    const xpToNextLevel = Math.max(10, nextLevelThreshold - xp);
    const levelProgressPercent = Math.min(
      100,
      Math.max(8, Math.round(((xp % 100) / 100) * 100))
    );

    const efficiencyScore =
      xp + completedTasksCount * 15 + publishedPostsCount * 20;

    const streakDays = isPrimaryUser ? 1 + (completedTasksCount > 0 ? 1 : 0) : 4 + idx;
    const bestStreakDays = Math.max(streakDays, isPrimaryUser ? 1 : 7);

    // Logros evaluados por umbrales reales sobre el estado
    const achievements: TeamAchievementItem[] = [
      {
        id: "ach-1",
        title: "Primer paso en Hubly",
        description: "Inicia tu primera sesión operativa en el espacio de trabajo.",
        icon: "🌱",
        unlocked: xp >= 50,
        progress: Math.min(1, xp >= 50 ? 1 : 0),
        target: 1,
        xpReward: 50,
        category: "racha",
      },
      {
        id: "ach-2",
        title: "Ejecutor de tareas",
        description: "Completa al menos 1 tarea pendiente desde el Dashboard o Mi espacio.",
        icon: "✅",
        unlocked: completedTasksCount >= 1,
        progress: Math.min(1, completedTasksCount),
        target: 1,
        xpReward: 40,
        category: "productividad",
      },
      {
        id: "ach-3",
        title: "Parrilla en movimiento",
        description: "Programa o publica 2 piezas de contenido para tus marcas.",
        icon: "📅",
        unlocked: publishedPostsCount + liveSubmittedPosts >= 2,
        progress: Math.min(2, publishedPostsCount + liveSubmittedPosts),
        target: 2,
        xpReward: 60,
        category: "contenido",
      },
      {
        id: "ach-4",
        title: "Velocidad constante",
        description: "Acumula más de 60 minutos de tiempo activo en entregables.",
        icon: "⚡",
        unlocked: activeMinutes >= 60,
        progress: Math.min(60, activeMinutes),
        target: 60,
        xpReward: 75,
        category: "productividad",
      },
      {
        id: "ach-5",
        title: "Cero pendientes del día",
        description: "Completa todas tus tareas programadas para hoy.",
        icon: "🏆",
        unlocked: completedTasksCount >= 2 && inProgressTasksCount <= 1,
        progress: Math.min(2, completedTasksCount),
        target: 2,
        xpReward: 100,
        category: "productividad",
      },
      {
        id: "ach-6",
        title: "Líder de escuadrón",
        description: "Alcanza el Nivel 3 de experiencia operativa en la agencia.",
        icon: "🚀",
        unlocked: level >= 3,
        progress: Math.min(3, level),
        target: 3,
        xpReward: 120,
        category: "equipo",
      },
    ];

    const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

    const activityBoost = completedTasksCount * 22 + publishedPostsCount * 18;
    const weeklyActivity: WeekdayActivityBar[] = [
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
        eventsCount: isPrimaryUser ? memberEvents.length : 6,
        percent: isPrimaryUser ? Math.min(100, Math.round(activityBoost * 0.8)) : 90,
      },
    ];

    return {
      ...member,
      tasksCompleted: completedTasksCount,
      tasksInProgress: inProgressTasksCount,
      postsPublished: publishedPostsCount,
      activeTimeLabel: activeTimeFormatted,
      points: xp,
      completedTasksCount,
      inProgressTasksCount,
      publishedPostsCount,
      submittedPostsCount: liveSubmittedPosts,
      activeMinutes,
      activeTimeFormatted,
      avgCycleFormatted,
      efficiencyScore,
      xp,
      level,
      xpToNextLevel,
      levelProgressPercent,
      streakDays,
      bestStreakDays,
      rankPosition: 1,
      achievements,
      unlockedAchievementsCount,
      totalAchievementsCatalog: 39,
      weeklyActivity,
    };
}

export function selectTeamProductivity(
  members: TeamMember[],
  tasks: TaskItem[],
  posts: PostItem[],
  activityEvents: ActivityEvent[],
  period: TeamProductivityPeriod = "30d",
  searchQuery = "",
  hasBackend = false
): TeamProductivityResult {
  const multiplier = getPeriodMultiplier(period);
  const query = searchQuery.trim().toLowerCase();

  const evaluated: EvaluatedTeamMember[] = members.map((member, idx) =>
    evaluateTeamMember(member, idx, { tasks, posts, activityEvents, multiplier, hasBackend })
  );

  const ranking = [...evaluated]
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .map((m, index) => ({
      ...m,
      rankPosition: index + 1,
    }));

  const rankById = new Map(ranking.map((r) => [r.id, r.rankPosition]));
  const withRank = evaluated.map((m) => ({
    ...m,
    rankPosition: rankById.get(m.id) || 1,
  }));

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
    totalAchievementsCatalog: 39,
  };
}
