import { calcPct } from "./account-health-evaluate";
import { isTaskCompleted } from "./tasks";
import type {
  AccountCommitment,
  AccountRecommendation,
  BrandWorkspace,
  PostItem,
  AgencyTask,
  RecommendationMetricKey,
} from "../types";

export interface SuggestedMetricItem {
  id: string;
  checked: boolean;
  icon: "globe" | "mouse" | "form" | "chat" | "ig" | "fb";
  title: string;
  subtitle: string;
  target: string;
}

export const DEFAULT_METRICS: SuggestedMetricItem[] = [
  {
    id: "m-lpv",
    checked: true,
    icon: "globe",
    title: "Landing page views / semana",
    subtitle: "Hoy llegan ~5.5 visitas a la página por semana",
    target: "5.5",
  },
  {
    id: "m-clicks",
    checked: true,
    icon: "mouse",
    title: "Clicks / semana",
    subtitle: "Hoy consigue ~330 clics por semana",
    target: "330",
  },
  {
    id: "m-leads",
    checked: false,
    icon: "form",
    title: "Leads (formularios) / semana",
    subtitle: "Cuando pides datos en un formulario dentro del anuncio",
    target: "12",
  },
  {
    id: "m-conv",
    checked: false,
    icon: "chat",
    title: "Conversaciones / semana",
    subtitle: "Mensajes iniciados por WhatsApp, Messenger o Instagram",
    target: "25",
  },
  {
    id: "m-ig",
    checked: false,
    icon: "ig",
    title: "Alcance en Instagram / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "5,000",
  },
  {
    id: "m-fb",
    checked: false,
    icon: "fb",
    title: "Alcance en Facebook / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "3,500",
  },
];

const METRIC_KEY_LABELS: Record<RecommendationMetricKey, string> = {
  posts: "Publicaciones mensuales",
  reels: "Reels mensuales",
  stories: "Stories mensuales",
  ads: "Campañas Ads",
};

export function mapMetricKeyToCommitmentPatch(
  metricKey: RecommendationMetricKey,
  value: number
): Partial<AccountCommitment> {
  if (metricKey === "posts") return { postsCommitted: value };
  if (metricKey === "reels") return { reelsCommitted: value };
  if (metricKey === "stories")
    return { StoriesCommitted: value, storiesCommitted: value };
  return { adCampaignsCommitted: value };
}

export function resolveEffectiveRecommendationValue(
  rec: Pick<AccountRecommendation, "id" | "recommendedCommitted">,
  customValues: Record<string, number>
): number {
  return customValues[rec.id] !== undefined
    ? customValues[rec.id]
    : rec.recommendedCommitted;
}

export function resolveRecommendationMetricTitle(
  rec: Pick<AccountRecommendation, "metricKey" | "metricTitle">
): string {
  return rec.metricTitle || METRIC_KEY_LABELS[rec.metricKey] || "Compromiso mensual";
}

export function computeRecommendationDelta(
  rec: Pick<AccountRecommendation, "id" | "currentCommitted" | "recommendedCommitted">,
  customValues: Record<string, number>
): { effectiveValue: number; diffAbs: number; diffPct: number } {
  const effectiveValue = resolveEffectiveRecommendationValue(rec, customValues);
  const diffAbs = effectiveValue - rec.currentCommitted;
  const diffPct =
    rec.currentCommitted > 0
      ? Math.round((diffAbs / rec.currentCommitted) * 100)
      : 100;
  return { effectiveValue, diffAbs, diffPct };
}

export function adjustRecommendationValue(
  rec: Pick<AccountRecommendation, "id" | "recommendedCommitted">,
  customValues: Record<string, number>,
  delta: number
): Record<string, number> {
  const current = resolveEffectiveRecommendationValue(rec, customValues);
  const next = Math.max(1, current + delta);
  return { ...customValues, [rec.id]: next };
}

export function toggleSuggestedMetric(
  metrics: SuggestedMetricItem[],
  id: string
): SuggestedMetricItem[] {
  return metrics.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m));
}

export function updateSuggestedMetricTarget(
  metrics: SuggestedMetricItem[],
  id: string,
  target: string
): SuggestedMetricItem[] {
  return metrics.map((m) => (m.id === id ? { ...m, target } : m));
}

export function buildEnrichedMetricsPayload(
  metrics: SuggestedMetricItem[],
  brands: BrandWorkspace[]
) {
  const selectedMetrics = metrics.filter((m) => m.checked);
  const firstBrand = brands[0];
  return selectedMetrics.map((m) => ({
    ...m,
    name: firstBrand?.name || m.title,
    runsPaidAds: firstBrand?.hasPaidAds ?? true,
    monthlySpend: firstBrand?.adBudget ?? 8345,
    commitments: {
      Publicaciones: firstBrand?.commitments?.postsCommitted ?? 12,
      Stories: firstBrand?.commitments?.StoriesCommitted ?? 16,
      Reels: firstBrand?.commitments?.reelsCommitted ?? 4,
      "Campañas Ads": firstBrand?.commitments?.adCampaignsCommitted ?? 2,
    },
    metrics: selectedMetrics.map((sm) => ({
      id: sm.id,
      name: sm.title,
      target: sm.target,
      unit: "por semana",
      checked: sm.checked,
    })),
  }));
}

export function selectAccountRecommendations(
  brands: BrandWorkspace[],
  tasks: AgencyTask[],
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
