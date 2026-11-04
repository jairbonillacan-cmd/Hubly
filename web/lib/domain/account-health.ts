import { addDaysToIsoDate, resolveDateInTimezone } from "./time";
import { evaluateBrandAccount } from "./account-health-evaluate";
import type {
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
