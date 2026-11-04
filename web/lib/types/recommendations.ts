export type RecommendationMetricKey = "posts" | "reels" | "stories" | "ads";

export type RecommendationRuleId =
  | "CONSISTENT_CAPACITY_UPGRADE"
  | "PAID_ADS_CONVERSION_TRACKING"
  | "OVERLOAD_RISK_ADJUSTMENT"
  | "STORY_CADENCE_BOOST"
  | "REELS_ENGAGEMENT_EXPANSION";

export interface AccountRecommendation {
  id: string;
  brandId: string;
  brandName: string;
  brandInitial: string;
  brandColor: string;
  brandBg?: string;
  metricKey: RecommendationMetricKey;
  metricTitle?: string;
  title?: string;
  priority?: "alta" | "media" | "baja" | "Alta" | "Media" | "Baja";
  icon?: "globe" | "mouse" | "messages" | "reach";
  currentCommitted: number;
  completedLastPeriod: number;
  recommendedCommitted: number;
  deltaPercent: number;
  ruleId: RecommendationRuleId;
  reason: string;
  dataSourceLabel: string;
  applied: boolean;
}

