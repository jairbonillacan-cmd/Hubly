import type { CustomFieldDefinition, SocialNetwork, WorkflowStatus } from "./social";

export interface BuyerPersona {
  id: string;
  name: string;
  ageRange: string;
  occupation: string;
  painPoints: string;
  motivation: string;
  accepted: boolean;
}

export interface BrandCore {
  whatTheySell: string;
  category: string;
  websiteUrl: string;
  toneOfVoice: string;
  pillars: string[];
  doWords: string[];
  dontWords: string[];
  personas: BuyerPersona[];
}

export type CommitmentPeriod =
  | "mes_actual"
  | "mes_anterior"
  | "trimestre"
  | "7d"
  | "30d"
  | "semana"
  | "mes"
  | "custom";

export interface PeriodCommitmentSnapshot {
  period: "mes_actual" | "mes_anterior" | "trimestre";
  postsCommitted: number;
  postsCompleted: number;
  StoriesCommitted: number;
  StoriesCompleted: number;
  storiesCommitted: number;
  storiesCompleted: number;
  reelsCommitted: number;
  reelsCompleted: number;
  adCampaignsCommitted: number;
  adCampaignsCompleted: number;
  adSpend?: number;
  reachTotal?: number;
  clicksTotal?: number;
  landingPageViewsPerWeek?: number;
  clicksPerWeek?: number;
}

export interface CustomCommitmentMetric {
  id: string;
  checked?: boolean;
  icon?: "globe" | "mouse" | "messages" | "reach";
  title?: string;
  subtitle?: string;
  target?: string;
  currentValue?: number;
  name?: string;
  unit?: string;
  value?: number | string;
}

export interface AccountCommitment {
  postsCommitted: number;
  postsCompleted: number;
  StoriesCommitted: number;
  StoriesCompleted: number;
  storiesCommitted: number;
  storiesCompleted: number;
  reelsCommitted: number;
  reelsCompleted: number;
  adCampaignsCommitted: number;
  adCampaignsCompleted: number;
  period: "mes_actual" | "mes_anterior" | "trimestre";
  periodHistory: {
    mes_actual: PeriodCommitmentSnapshot;
    mes_anterior: PeriodCommitmentSnapshot;
    trimestre: PeriodCommitmentSnapshot;
  };
  customMetrics?: CustomCommitmentMetric[];
  hasDeclaredCommitments?: boolean;
}

export type BrandHealthStatus = "completa" | "en_progreso" | "en_riesgo" | "sin_compromisos";

export interface BrandWorkspace {
  mediaFolders?: string[];
  workflowStatuses?: WorkflowStatus[];
  customFieldDefinitions?: CustomFieldDefinition[];
  id: string;
  name: string;
  slug: string;
  handle: string;
  shareToken: string;
  initials: string;
  initial: string;
  color: string;
  avatarBg: string;
  avatarColor: string;
  industry: string;
  city: string;
  connectedNetworks: SocialNetwork[];
  Networks: SocialNetwork[];
  monthlyPostTarget: number;
  monthlyBudget: number;
  monthlySpend?: number;
  adBudget: number;
  hasPaidAds: boolean;
  paidAdsLabel: "con pauta" | "sin pauta";
  healthStatus: BrandHealthStatus;
  healthScore: number;
  status?: string;
  pinned?: boolean;
  archived?: boolean;
  commitments: AccountCommitment;
  core: BrandCore;
  bioLink: {
    handle: string;
    headline: string;
    whatsapp: string;
    buttons: { id: string; label: string; url: string }[];
  };
}
