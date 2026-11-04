import { addDaysToIsoDate, resolveDateInTimezone } from "./time";
import { evaluateBrandAccount } from "./account-health-evaluate";
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

export type AccountHealthSortBy =
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

export interface AccountsHealthSummary {
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

export interface CommitmentDraft {
  postsCommitted: number;
  postsCompleted: number;
  StoriesCommitted: number;
  StoriesCompleted: number;
  reelsCommitted: number;
  reelsCompleted: number;
  adCampaignsCommitted: number;
  adCampaignsCompleted: number;
  hasPaidAds: boolean;
  monthlySpend: number;
  customMetrics: CustomCommitmentMetric[];
}

export type DraftNumberKey = Exclude<keyof CommitmentDraft, "hasPaidAds" | "customMetrics">;

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

function buildHealthSummary(allEvaluatedAccounts: EvaluatedBrandAccount[]): AccountsHealthSummary {
  const totalAccounts = allEvaluatedAccounts.length;
  const completeCount = allEvaluatedAccounts.filter((a) => a.isComplete).length;
  const atRiskCount = allEvaluatedAccounts.filter((a) => a.isAtRisk).length;
  const inProgressCount = allEvaluatedAccounts.filter((a) => !a.isComplete && !a.isAtRisk).length;
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

  return {
    totalAccounts,
    totalBrands: totalAccounts,
    completeCount,
    inProgressCount,
    atRiskCount,
    withPaidAdsCount,
    withoutPaidAdsCount,
    uncommittedBrandsCount,
    averageHealthScore,
  };
}

export function selectAccountsHealth(
  brands: BrandWorkspace[],
  tasks: AgencyTask[],
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
  const allEvaluatedAccounts: EvaluatedBrandAccount[] = activeBrands.map((brand) =>
    evaluateBrandAccount(brand, { tasks, posts, period, todayIso, tomorrowIso })
  );

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
    summary: buildHealthSummary(allEvaluatedAccounts),
    period,
    normalizedFilter,
  };
}

export function resolveCommitmentPeriodKey(
  period: CommitmentPeriod
): "mes_actual" | "mes_anterior" | "trimestre" {
  if (period === "mes_anterior") return "mes_anterior";
  if (period === "trimestre") return "trimestre";
  return "mes_actual";
}

export function sortEvaluatedAccounts(
  accounts: EvaluatedBrandAccount[],
  sortBy: AccountHealthSortBy
): EvaluatedBrandAccount[] {
  const base =
    sortBy === "name_asc"
      ? [...accounts].sort((a, b) => a.brand.name.localeCompare(b.brand.name, "es"))
      : [...accounts];
  return base.sort(
    (a, b) => Number(Boolean(b.brand.pinned)) - Number(Boolean(a.brand.pinned))
  );
}

export function createCommitmentDraft(account: EvaluatedBrandAccount): CommitmentDraft {
  const { snapshot, customMetrics } = account;
  return {
    postsCommitted: snapshot.postsCommitted,
    postsCompleted: snapshot.postsCompleted,
    StoriesCommitted: snapshot.StoriesCommitted ?? snapshot.storiesCommitted ?? 16,
    StoriesCompleted: snapshot.StoriesCompleted ?? snapshot.storiesCompleted ?? 14,
    reelsCommitted: snapshot.reelsCommitted,
    reelsCompleted: snapshot.reelsCompleted,
    adCampaignsCommitted: snapshot.adCampaignsCommitted,
    adCampaignsCompleted: snapshot.adCampaignsCompleted,
    hasPaidAds: account.hasPaidAds,
    monthlySpend: account.brand.monthlySpend ?? snapshot.adSpend ?? 0,
    customMetrics: customMetrics.map((m) => ({ ...m })),
  };
}

export function buildCommitmentSavePayload(
  draft: CommitmentDraft,
  period: CommitmentPeriod
): {
  brandPatch: { hasPaidAds: boolean; monthlySpend: number };
  commitmentsPatch: Partial<AccountCommitment> & Partial<PeriodCommitmentSnapshot>;
  targetPeriodKey: "mes_actual" | "mes_anterior" | "trimestre";
} {
  // Al editar con la ventana de 7 días, las cifras semanales se escalan x4 al guardarlas como mes.
  const k = period === "7d" ? 4 : 1;
  const scaled = (n: number, factor = k) => Math.max(0, Math.round(n * factor));
  const StoriesCommitted = scaled(draft.StoriesCommitted);
  const StoriesCompleted = scaled(draft.StoriesCompleted);
  const normalizedMonthlySpend = Math.max(0, Number(draft.monthlySpend) || 0);
  const spend = draft.hasPaidAds ? normalizedMonthlySpend : 0;

  return {
    brandPatch: {
      hasPaidAds: draft.hasPaidAds,
      monthlySpend: normalizedMonthlySpend,
    },
    commitmentsPatch: {
      hasDeclaredCommitments: true,
      postsCommitted: scaled(draft.postsCommitted),
      postsCompleted: scaled(draft.postsCompleted),
      StoriesCommitted,
      StoriesCompleted,
      storiesCommitted: StoriesCommitted,
      storiesCompleted: StoriesCompleted,
      reelsCommitted: scaled(draft.reelsCommitted),
      reelsCompleted: scaled(draft.reelsCompleted),
      adCampaignsCommitted: scaled(draft.adCampaignsCommitted, 1),
      adCampaignsCompleted: scaled(draft.adCampaignsCompleted, 1),
      adSpend: spend,
      customMetrics: draft.customMetrics,
    },
    targetPeriodKey: resolveCommitmentPeriodKey(period),
  };
}
