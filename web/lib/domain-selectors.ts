import type {
  AccountCommitment,
  AccountRecommendation,
  ActivityEvent,
  BrandHealthStatus,
  BrandWorkspace,
  CommitmentPeriod,
  CustomCommitmentMetric,
  PeriodCommitmentSnapshot,
  PostItem,
  TaskItem,
  TeamMember,
} from "./types";
import { backendEnabled } from "./supabase/config";
import { addDaysToIsoDate, resolveDateInTimezone } from "./domain/time";
import { computeTaskDueBucket, isTaskCompleted } from "./domain/tasks";
import { isPostInApproval } from "./domain/posts";

// Lo que se fue a su módulo sigue entrando por aquí: las pantallas no cambian de import.
export * from "./domain/time";
export * from "./domain/greeting";
export * from "./domain/tasks";
export * from "./domain/posts";
export * from "./domain/onboarding";

/* ========================================================================== */
/* 1. SALUDO Y FECHA DINÁMICOS POR ZONA HORARIA                               */
/* ========================================================================== */


/* ========================================================================== */
/* 4. SELECTOR DE SALUD DE CUENTAS (PERIODOS, FILTROS, BÚSQUEDA Y RESUMEN)    */
/* ========================================================================== */

export type AccountHealthFilter =
  | "todas"
  | "con_pauta"
  | "sin_pauta"
  | "en_riesgo"
  | "completas"
  | "Todas"
  | "Con pauta"
  | "Sin pauta"
  | "En riesgo"
  | "Completas";

type AccountHealthSortBy =
  | "name_asc"
  | "health_desc"
  | "health_asc"
  | "budget_desc"
  | "fulfillment_desc";

export type AccountsHealthFilter = AccountHealthFilter;

export interface DeliverableCommitmentSummary {
  key: "posts" | "stories" | "reels" | "ads";
  label: string;
  completed: number;
  committed: number;
  percent: number;
}

interface AccountsHealthOptions {
  period?: CommitmentPeriod;
  filter?: AccountHealthFilter;
  searchQuery?: string;
  sortBy?: AccountHealthSortBy;
  referenceNow?: string | Date | { fixedIsoNow?: string | null } | null;
}

export interface EvaluatedBrandAccount extends BrandWorkspace {
  brand: BrandWorkspace;
  activePeriodKey: "mes_actual" | "mes_anterior" | "trimestre";
  periodSnapshot: PeriodCommitmentSnapshot;
  snapshot: PeriodCommitmentSnapshot;
  customMetrics: CustomCommitmentMetric[];
  deliverables: DeliverableCommitmentSummary[];
  taskProgress: number;
  urgentTasksCount: number;
  totalCommitted: number;
  totalCompleted: number;
  fulfillmentPercent: number;
  postsFulfillmentPercent: number;
  storiesFulfillmentPercent: number;
  reelsFulfillmentPercent: number;
  adsFulfillmentPercent: number;
  overdueTasksCount: number;
  pendingTasksCount: number;
  pendingApprovalsCount: number;
  computedHealthScore: number;
  computedHealthStatus: BrandHealthStatus;
  isAtRisk: boolean;
  isComplete: boolean;
}

interface AccountsHealthSummary {
  totalAccounts: number;
  totalBrands: number;
  completeCount: number;
  inProgressCount: number;
  atRiskCount: number;
  withPaidAdsCount: number;
  withoutPaidAdsCount: number;
  uncommittedBrandsCount: number;
  averageHealthScore: number;
}

interface AccountsHealthResult {
  accounts: EvaluatedBrandAccount[];
  allEvaluatedAccounts: EvaluatedBrandAccount[];
  summary: AccountsHealthSummary;
  period: CommitmentPeriod;
  normalizedFilter: "todas" | "con_pauta" | "sin_pauta" | "en_riesgo" | "completas";
}

function normalizeHealthFilter(
  filter?: AccountHealthFilter
): "todas" | "con_pauta" | "sin_pauta" | "en_riesgo" | "completas" {
  const raw = (filter || "todas").toLowerCase().trim().replace(/\s+/g, "_");
  if (raw === "con_pauta") return "con_pauta";
  if (raw === "sin_pauta") return "sin_pauta";
  if (raw === "en_riesgo") return "en_riesgo";
  if (raw === "completas" || raw === "completa") return "completas";
  return "todas";
}

function resolvePeriodSnapshot(
  commitments: AccountCommitment | undefined,
  period: CommitmentPeriod = "mes_actual"
): {
  periodKey: "mes_actual" | "mes_anterior" | "trimestre";
  snapshot: PeriodCommitmentSnapshot;
} {
  const fallback: PeriodCommitmentSnapshot = {
    period: "mes_actual",
    postsCommitted: commitments?.postsCommitted ?? 12,
    postsCompleted: commitments?.postsCompleted ?? 10,
    StoriesCommitted: commitments?.StoriesCommitted ?? commitments?.storiesCommitted ?? 16,
    StoriesCompleted: commitments?.StoriesCompleted ?? commitments?.storiesCompleted ?? 14,
    storiesCommitted: commitments?.storiesCommitted ?? commitments?.StoriesCommitted ?? 16,
    storiesCompleted: commitments?.storiesCompleted ?? commitments?.StoriesCompleted ?? 14,
    reelsCommitted: commitments?.reelsCommitted ?? 4,
    reelsCompleted: commitments?.reelsCompleted ?? 4,
    adCampaignsCommitted: commitments?.adCampaignsCommitted ?? 1,
    adCampaignsCompleted: commitments?.adCampaignsCompleted ?? 1,
    adSpend: 0,
    reachTotal: 0,
    clicksTotal: 0,
    landingPageViewsPerWeek: 5.5,
    clicksPerWeek: 330,
  };

  if (!commitments) {
    return { periodKey: "mes_actual", snapshot: fallback };
  }

  if (period === "mes_anterior") {
    const snap = commitments.periodHistory?.mes_anterior || fallback;
    return {
      periodKey: "mes_anterior",
      snapshot: {
        ...snap,
        StoriesCommitted: snap.StoriesCommitted ?? snap.storiesCommitted,
        StoriesCompleted: snap.StoriesCompleted ?? snap.storiesCompleted,
        storiesCommitted: snap.storiesCommitted ?? snap.StoriesCommitted,
        storiesCompleted: snap.storiesCompleted ?? snap.StoriesCompleted,
      },
    };
  }

  if (period === "trimestre" || period === "custom") {
    const snap = commitments.periodHistory?.trimestre || fallback;
    return {
      periodKey: "trimestre",
      snapshot: {
        ...snap,
        StoriesCommitted: snap.StoriesCommitted ?? snap.storiesCommitted,
        StoriesCompleted: snap.StoriesCompleted ?? snap.storiesCompleted,
        storiesCommitted: snap.storiesCommitted ?? snap.StoriesCommitted,
        storiesCompleted: snap.storiesCompleted ?? snap.StoriesCompleted,
      },
    };
  }

  if (period === "7d" || period === "semana") {
    const base = commitments.periodHistory?.mes_actual || fallback;
    const scale = (n: number) => Math.max(1, Math.round(n / 4));
    return {
      periodKey: "mes_actual",
      snapshot: {
        ...base,
        postsCommitted: scale(base.postsCommitted),
        postsCompleted: Math.min(scale(base.postsCommitted), scale(base.postsCompleted)),
        StoriesCommitted: scale(base.StoriesCommitted),
        StoriesCompleted: Math.min(scale(base.StoriesCommitted), scale(base.StoriesCompleted)),
        storiesCommitted: scale(base.storiesCommitted),
        storiesCompleted: Math.min(scale(base.storiesCommitted), scale(base.storiesCompleted)),
        reelsCommitted: scale(base.reelsCommitted),
        reelsCompleted: Math.min(scale(base.reelsCommitted), scale(base.reelsCompleted)),
        adCampaignsCommitted: base.adCampaignsCommitted,
        adCampaignsCompleted: base.adCampaignsCompleted,
        adSpend: base.adSpend ? Math.round(base.adSpend / 4) : 0,
      },
    };
  }

  // Default: "mes_actual" | "30d" | "mes"
  const baseActual = commitments.periodHistory?.mes_actual || fallback;
  return {
    periodKey: "mes_actual",
    snapshot: {
      ...baseActual,
      postsCommitted: commitments.postsCommitted ?? baseActual.postsCommitted,
      postsCompleted: commitments.postsCompleted ?? baseActual.postsCompleted,
      StoriesCommitted:
        commitments.StoriesCommitted ??
        commitments.storiesCommitted ??
        baseActual.StoriesCommitted,
      StoriesCompleted:
        commitments.StoriesCompleted ??
        commitments.storiesCompleted ??
        baseActual.StoriesCompleted,
      storiesCommitted:
        commitments.storiesCommitted ??
        commitments.StoriesCommitted ??
        baseActual.storiesCommitted,
      storiesCompleted:
        commitments.storiesCompleted ??
        commitments.StoriesCompleted ??
        baseActual.storiesCompleted,
      reelsCommitted: commitments.reelsCommitted ?? baseActual.reelsCommitted,
      reelsCompleted: commitments.reelsCompleted ?? baseActual.reelsCompleted,
      adCampaignsCommitted:
        commitments.adCampaignsCommitted ?? baseActual.adCampaignsCommitted,
      adCampaignsCompleted:
        commitments.adCampaignsCompleted ?? baseActual.adCampaignsCompleted,
    },
  };
}

function calcPct(completed: number, committed: number): number {
  if (committed <= 0) return 100;
  return Math.min(100, Math.round((completed / committed) * 100));
}

export function selectAccountsHealth(
  brands: BrandWorkspace[],
  tasks: TaskItem[],
  posts: PostItem[],
  options: AccountsHealthOptions = {}
): AccountsHealthResult {
  const period = options.period || "mes_actual";
  const normalizedFilter = normalizeHealthFilter(options.filter);
  const searchQuery = (options.searchQuery || "").trim().toLowerCase();
  const sortBy = options.sortBy || "name_asc";
  const refNowValue =
    options.referenceNow &&
    typeof options.referenceNow === "object" &&
    !(options.referenceNow instanceof Date)
      ? options.referenceNow.fixedIsoNow
      : options.referenceNow;
  const { isoDate: todayIso } = resolveDateInTimezone(refNowValue);
  const tomorrowIso = addDaysToIsoDate(todayIso, 1);

  const activeBrands = brands.filter((b) => !b.archived);

  const allEvaluatedAccounts: EvaluatedBrandAccount[] = activeBrands.map((brand) => {
    const { periodKey, snapshot } = resolvePeriodSnapshot(brand.commitments, period);

    const brandTasks = tasks.filter((t) => t.brandId === brand.id);
    const pendingBrandTasks = brandTasks.filter((t) => !isTaskCompleted(t));
    const overdueTasksCount = pendingBrandTasks.filter(
      (t) => computeTaskDueBucket(t, todayIso, tomorrowIso) === "overdue"
    ).length;

    const brandPosts = posts.filter((p) => p.brandId === brand.id);
    const pendingApprovalsCount = brandPosts.filter((p) => isPostInApproval(p)).length;

    const totalCommitted =
      snapshot.postsCommitted +
      snapshot.StoriesCommitted +
      snapshot.reelsCommitted +
      snapshot.adCampaignsCommitted;

    const totalCompleted =
      snapshot.postsCompleted +
      snapshot.StoriesCompleted +
      snapshot.reelsCompleted +
      snapshot.adCampaignsCompleted;

    const fulfillmentPercent =
      totalCommitted > 0
        ? Math.min(100, Math.round((totalCompleted / totalCommitted) * 100))
        : 0;

    const postsFulfillmentPercent = calcPct(
      snapshot.postsCompleted,
      snapshot.postsCommitted
    );
    const storiesFulfillmentPercent = calcPct(
      snapshot.StoriesCompleted,
      snapshot.StoriesCommitted
    );
    const reelsFulfillmentPercent = calcPct(
      snapshot.reelsCompleted,
      snapshot.reelsCommitted
    );
    const adsFulfillmentPercent = calcPct(
      snapshot.adCampaignsCompleted,
      snapshot.adCampaignsCommitted
    );

    const overduePenalty = periodKey === "mes_actual" ? overdueTasksCount * 4 : 0;
    const computedHealthScore = Math.max(
      15,
      Math.min(100, fulfillmentPercent - overduePenalty)
    );

    const isAtRisk =
      fulfillmentPercent < 50 ||
      (periodKey === "mes_actual" && overdueTasksCount >= 2);
    const isComplete =
      totalCommitted > 0 &&
      fulfillmentPercent >= 100 &&
      (periodKey !== "mes_actual" || overdueTasksCount === 0);

    let computedHealthStatus: BrandHealthStatus = "en_progreso";
    if (isComplete) {
      computedHealthStatus = "completa";
    } else if (isAtRisk) {
      computedHealthStatus = "en_riesgo";
    }

    const customMetrics: CustomCommitmentMetric[] = (
      brand.commitments?.customMetrics || []
    ).map((m) => ({
      ...m,
      name: m.name || m.title || "Métrica",
      unit: m.unit || m.subtitle || "sem",
      value: m.value ?? m.target ?? 0,
    }));

    const deliverables: DeliverableCommitmentSummary[] = [
      {
        key: "posts",
        label: "Publicaciones",
        completed: snapshot.postsCompleted,
        committed: snapshot.postsCommitted,
        percent: postsFulfillmentPercent,
      },
      {
        key: "stories",
        label: "Stories",
        completed: snapshot.StoriesCompleted,
        committed: snapshot.StoriesCommitted,
        percent: storiesFulfillmentPercent,
      },
      {
        key: "reels",
        label: "Reels",
        completed: snapshot.reelsCompleted,
        committed: snapshot.reelsCommitted,
        percent: reelsFulfillmentPercent,
      },
      {
        key: "ads",
        label: "Campañas Ads",
        completed: snapshot.adCampaignsCompleted,
        committed: snapshot.adCampaignsCommitted,
        percent: adsFulfillmentPercent,
      },
    ];

    const taskProgress =
      brandTasks.length > 0
        ? Math.round(
            ((brandTasks.length - pendingBrandTasks.length) / brandTasks.length) *
              100
          )
        : 100;

    const urgentTasksCount = pendingBrandTasks.filter(
      (t) =>
        computeTaskDueBucket(t, todayIso, tomorrowIso) === "overdue" ||
        String(t.priority).toLowerCase() === "alta"
    ).length;

    const normalizedBrand: BrandWorkspace = {
      ...brand,
      monthlySpend: brand.monthlySpend ?? brand.adBudget ?? snapshot.adSpend ?? 0,
      status: brand.status ?? (brand.archived ? "archived" : "active"),
      healthScore: computedHealthScore,
      healthStatus: computedHealthStatus,
    };

    return {
      ...normalizedBrand,
      brand: normalizedBrand,
      activePeriodKey: periodKey,
      periodSnapshot: snapshot,
      snapshot,
      customMetrics,
      deliverables,
      taskProgress,
      urgentTasksCount,
      totalCommitted,
      totalCompleted,
      fulfillmentPercent,
      postsFulfillmentPercent,
      storiesFulfillmentPercent,
      reelsFulfillmentPercent,
      adsFulfillmentPercent,
      overdueTasksCount,
      pendingTasksCount: pendingBrandTasks.length,
      pendingApprovalsCount,
      computedHealthScore,
      computedHealthStatus,
      isAtRisk,
      isComplete,
    };
  });

  // Summary across all non-archived accounts in the workspace for the selected period
  const totalAccounts = allEvaluatedAccounts.length;
  const completeCount = allEvaluatedAccounts.filter((a) => a.isComplete).length;
  const atRiskCount = allEvaluatedAccounts.filter((a) => a.isAtRisk).length;
  const inProgressCount = allEvaluatedAccounts.filter(
    (a) => !a.isComplete && !a.isAtRisk
  ).length;
  const withPaidAdsCount = allEvaluatedAccounts.filter((a) => a.hasPaidAds).length;
  const withoutPaidAdsCount = allEvaluatedAccounts.filter((a) => !a.hasPaidAds).length;
  const uncommittedBrandsCount = allEvaluatedAccounts.filter(
    (a) => a.commitments?.hasDeclaredCommitments === false
  ).length;

  const averageHealthScore =
    totalAccounts > 0
      ? Math.round(
          allEvaluatedAccounts.reduce((acc, item) => acc + item.computedHealthScore, 0) /
            totalAccounts
        )
      : 0;

  // Apply status filter + search filter
  const filtered = allEvaluatedAccounts.filter((account) => {
    if (normalizedFilter === "con_pauta" && !account.hasPaidAds) return false;
    if (normalizedFilter === "sin_pauta" && account.hasPaidAds) return false;
    if (normalizedFilter === "en_riesgo" && !account.isAtRisk) return false;
    if (normalizedFilter === "completas" && !account.isComplete) return false;

    if (searchQuery) {
      const hay = `${account.name} ${account.handle} ${account.slug} ${account.industry} ${account.city}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }

    return true;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "health_desc") return b.computedHealthScore - a.computedHealthScore;
    if (sortBy === "health_asc") return a.computedHealthScore - b.computedHealthScore;
    if (sortBy === "budget_desc") return (b.adBudget || 0) - (a.adBudget || 0);
    if (sortBy === "fulfillment_desc") return b.fulfillmentPercent - a.fulfillmentPercent;
    return 0;
  });

  return {
    accounts: sorted,
    allEvaluatedAccounts,
    summary: {
      totalAccounts,
      totalBrands: totalAccounts,
      completeCount,
      inProgressCount,
      atRiskCount,
      withPaidAdsCount,
      withoutPaidAdsCount,
      uncommittedBrandsCount,
      averageHealthScore,
    },
    period,
    normalizedFilter,
  };
}

/* ========================================================================== */
/* 5. MOTOR DETERMINISTA DE REGLAS DE RECOMENDACIONES DE COMPROMISOS          */
/* ========================================================================== */

export function selectAccountRecommendations(
  brands: BrandWorkspace[],
  tasks: TaskItem[],
  posts: PostItem[],
  dismissedIds: string[] = [],
  appliedMap: Record<string, boolean> = {}
): AccountRecommendation[] {
  const dismissedSet = new Set(dismissedIds);
  const recommendations: AccountRecommendation[] = [];

  for (const brand of brands) {
    if (brand.archived) continue;

    const current = brand.commitments;
    if (!current) continue;

    const lastMonth =
      current.periodHistory?.mes_anterior || current.periodHistory?.mes_actual;
    const brandTasks = tasks.filter((t) => t.brandId === brand.id && !isTaskCompleted(t));
    const overdueCount = brandTasks.filter((t) => t.dueBucket === "overdue").length;
    const brandPosts = posts.filter((p) => p.brandId === brand.id);

    // Regla 1: CONSISTENT_CAPACITY_UPGRADE
    // Cuando la marca cumplió >= 90% en el periodo anterior y no tiene sobrecarga de tareas vencidas
    const prevPostsCommitted = lastMonth?.postsCommitted || current.postsCommitted || 12;
    const prevPostsCompleted = lastMonth?.postsCompleted || current.postsCompleted || 12;
    const prevPostsRatio =
      prevPostsCommitted > 0 ? Math.round((prevPostsCompleted / prevPostsCommitted) * 100) : 100;

    if (prevPostsRatio >= 90 && overdueCount === 0) {
      const recId = `rec-${brand.id}-posts-upgrade`;
      if (!dismissedSet.has(recId)) {
        const increment = brand.hasPaidAds ? 2 : 1;
        const recommendedCommitted = current.postsCommitted + increment;
        const deltaPercent = Math.round(
          ((recommendedCommitted - current.postsCommitted) /
            Math.max(1, current.postsCommitted)) *
            100
        );
        recommendations.push({
          id: recId,
          brandId: brand.id,
          brandName: brand.name,
          brandInitial: brand.initial || brand.initials,
          brandColor: brand.color,
          brandBg: brand.avatarBg,
          metricKey: "posts",
          metricTitle: "Publicaciones mensuales en feed",
          title: `Subir a ${recommendedCommitted} posts/mes`,
          priority: "media",
          icon: "globe",
          currentCommitted: current.postsCommitted,
          completedLastPeriod: prevPostsCompleted,
          recommendedCommitted,
          deltaPercent,
          ruleId: "CONSISTENT_CAPACITY_UPGRADE",
          reason: `${brand.name} entregó ${prevPostsCompleted}/${prevPostsCommitted} posts el mes pasado (${prevPostsRatio}%) sin tareas vencidas${
            brand.hasPaidAds ? ` y mantiene pauta activa de $${brand.adBudget.toLocaleString("en-US")}` : ""
          }. Subir +${increment} posts capitaliza el alcance orgánico y pagado.`,
          dataSourceLabel: `Historial últimos 3 meses · Cumplimiento ${prevPostsRatio}%`,
          applied: Boolean(appliedMap[recId]),
        });
      }
    }

    // Regla 2: PAID_ADS_CONVERSION_TRACKING
    // Cuando la marca tiene presupuesto de pauta activo (hasPaidAds === true && adBudget > 0)
    if (brand.hasPaidAds && brand.adBudget > 0) {
      const recId = `rec-${brand.id}-ads-upgrade`;
      if (!dismissedSet.has(recId)) {
        const currentAds = current.adCampaignsCommitted || 2;
        const prevAdsCompleted = lastMonth?.adCampaignsCompleted ?? currentAds;
        const recommendedAds = currentAds + 1;
        const deltaPercent = Math.round(
          ((recommendedAds - currentAds) / Math.max(1, currentAds)) * 100
        );
        recommendations.push({
          id: recId,
          brandId: brand.id,
          brandName: brand.name,
          brandInitial: brand.initial || brand.initials,
          brandColor: brand.color,
          brandBg: brand.avatarBg,
          metricKey: "ads",
          metricTitle: "Campañas y creatividades de pauta / mes",
          title: `Sumar +1 campaña Ads (${recommendedAds}/mes)`,
          priority: "alta",
          icon: "mouse",
          currentCommitted: currentAds,
          completedLastPeriod: prevAdsCompleted,
          recommendedCommitted: recommendedAds,
          deltaPercent,
          ruleId: "PAID_ADS_CONVERSION_TRACKING",
          reason: `Esta marca pauta ($${brand.adBudget.toLocaleString("en-US")} este mes) con ~${
            current.periodHistory?.mes_actual?.clicksPerWeek ?? 330
          } clics/semana y ~${
            current.periodHistory?.mes_actual?.landingPageViewsPerWeek ?? 5.5
          } visitas a landing/semana. Sumar +1 campaña activa evita fatiga creativa.`,
          dataSourceLabel: `Meta & TikTok Ads · Gasto mensual $${brand.adBudget.toLocaleString("en-US")}`,
          applied: Boolean(appliedMap[recId]),
        });
      }
    }

    // Regla 3: REELS_ENGAGEMENT_EXPANSION
    // Cuando la marca tiene TikTok o Instagram conectado y su meta de Reels es <= 6
    const hasShortVideoNet =
      brand.connectedNetworks.includes("TikTok") ||
      brand.connectedNetworks.includes("Instagram");
    if (hasShortVideoNet && current.reelsCommitted <= 6 && overdueCount < 2) {
      const recId = `rec-${brand.id}-reels-expansion`;
      if (!dismissedSet.has(recId)) {
        const prevReels = lastMonth?.reelsCompleted ?? current.reelsCompleted;
        const recommendedReels = current.reelsCommitted + 2;
        const deltaPercent = Math.round(
          ((recommendedReels - current.reelsCommitted) /
            Math.max(1, current.reelsCommitted)) *
            100
        );
        const avgReach =
          brandPosts.length > 0
            ? Math.round(
                brandPosts.reduce((s, p) => s + (p.metrics?.reach || 14000), 0) /
                  brandPosts.length
              )
            : 18500;
        recommendations.push({
          id: recId,
          brandId: brand.id,
          brandName: brand.name,
          brandInitial: brand.initial || brand.initials,
          brandColor: brand.color,
          brandBg: brand.avatarBg,
          metricKey: "reels",
          metricTitle: "Reels / Videos verticales al mes",
          title: `Ampliar a ${recommendedReels} Reels/mes`,
          priority: "media",
          icon: "reach",
          currentCommitted: current.reelsCommitted,
          completedLastPeriod: prevReels,
          recommendedCommitted: recommendedReels,
          deltaPercent,
          ruleId: "REELS_ENGAGEMENT_EXPANSION",
          reason: `Los formatos de video en ${brand.name} promedian ${avgReach.toLocaleString(
            "en-US"
          )} cuentas alcanzadas. Elevar de ${current.reelsCommitted} a ${recommendedReels} Reels/mes acelera el descubrimiento.`,
          dataSourceLabel: `Rendimiento de formato · Alcance medio ${avgReach.toLocaleString("en-US")}`,
          applied: Boolean(appliedMap[recId]),
        });
      }
    }

    // Regla 4: OVERLOAD_RISK_ADJUSTMENT
    // Si una marca está en riesgo (cumplimiento < 60% o tareas vencidas >= 2), sugiere ajustar meta para estabilizar entregas
    const currentPostsPct = calcPct(current.postsCompleted, current.postsCommitted);
    if (currentPostsPct < 60 || overdueCount >= 2) {
      const recId = `rec-${brand.id}-overload-adjust`;
      if (!dismissedSet.has(recId)) {
        const recommendedPosts = Math.max(8, current.postsCommitted - 2);
        const deltaPercent = Math.round(
          ((recommendedPosts - current.postsCommitted) /
            Math.max(1, current.postsCommitted)) *
            100
        );
        recommendations.push({
          id: recId,
          brandId: brand.id,
          brandName: brand.name,
          brandInitial: brand.initial || brand.initials,
          brandColor: brand.color,
          brandBg: brand.avatarBg,
          metricKey: "posts",
          metricTitle: "Ajuste preventivo de cadencia de posts",
          title: `Ajustar meta a ${recommendedPosts} posts/mes`,
          priority: "alta",
          icon: "messages",
          currentCommitted: current.postsCommitted,
          completedLastPeriod: current.postsCompleted,
          recommendedCommitted: recommendedPosts,
          deltaPercent,
          ruleId: "OVERLOAD_RISK_ADJUSTMENT",
          reason: `${brand.name} registra ${current.postsCompleted}/${current.postsCommitted} posts (${currentPostsPct}%) en el periodo actual y ${overdueCount} tareas atrasadas. Ajustar la meta a ${recommendedPosts} posts permite recuperar el 100% de cumplimiento.`,
          dataSourceLabel: `Salud de cuenta · ${overdueCount} tareas vencidas · Avance ${currentPostsPct}%`,
          applied: Boolean(appliedMap[recId]),
        });
      }
    }
  }

  return recommendations;
}

/* ========================================================================== */
/* 6. SELECTOR DE PRODUCTIVIDAD DE EQUIPO, LOGROS Y RANKING POR EVENTOS       */
/* ========================================================================== */

export type TeamProductivityPeriod = "7d" | "30d" | "90d" | "mes" | "semana" | "hoy";

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

interface TeamProductivityResult {
  members: EvaluatedTeamMember[];
  ranking: EvaluatedTeamMember[];
  activeMember: EvaluatedTeamMember;
  totalMembersCount: number;
  period: TeamProductivityPeriod;
  totalAchievementsCatalog: number;
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

export function selectTeamProductivity(
  members: TeamMember[],
  tasks: TaskItem[],
  posts: PostItem[],
  activityEvents: ActivityEvent[],
  period: TeamProductivityPeriod = "30d",
  searchQuery = ""
): TeamProductivityResult {
  const multiplier = getPeriodMultiplier(period);
  const query = searchQuery.trim().toLowerCase();

  const evaluated: EvaluatedTeamMember[] = members.map((member, idx) => {
    // Las cifras iniciales de la demo no aplican a cuentas reales.
    const isPrimaryUser =
      !backendEnabled &&
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
  });

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

/* ========================================================================== */
/* 7. SELECTOR DE PROGRESO DE ONBOARDING ("DESCUBRE HUBLY")                   */
/* ========================================================================== */

