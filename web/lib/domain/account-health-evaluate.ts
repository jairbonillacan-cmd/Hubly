import { computeTaskDueBucket, isTaskCompleted } from "./tasks";
import { isPostInApproval } from "./posts";
import type {
  AccountCommitment,
  BrandHealthStatus,
  BrandWorkspace,
  CommitmentPeriod,
  CustomCommitmentMetric,
  PeriodCommitmentSnapshot,
  PostItem,
  AgencyTask,
} from "../types";
import type { DeliverableCommitmentSummary, EvaluatedBrandAccount } from "./account-health";

/** Evalúa una marca: compromisos del periodo, tareas, aprobaciones y salud. */
export function evaluateBrandAccount(
  brand: BrandWorkspace,
  ctx: {
    tasks: AgencyTask[];
    posts: PostItem[];
    period: CommitmentPeriod;
    todayIso: string;
    tomorrowIso: string;
  }
): EvaluatedBrandAccount {
  const { tasks, posts, period, todayIso, tomorrowIso } = ctx;
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

export function calcPct(completed: number, committed: number): number {
  if (committed <= 0) return 100;
  return Math.min(100, Math.round((completed / committed) * 100));
}

