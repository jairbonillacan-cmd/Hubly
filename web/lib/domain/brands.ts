import type { AccountCommitment, BrandWorkspace, PeriodCommitmentSnapshot } from "../types";

export type CommitmentPeriodKey = "mes_actual" | "mes_anterior" | "trimestre";

/**
 * Aplica un cambio de compromisos a una marca. El histórico del periodo manda; el mes
 * actual se refleja además en los campos sueltos del compromiso, que son los que lee la UI.
 */
export function applyCommitmentPatch(
  brand: BrandWorkspace,
  patch: Partial<AccountCommitment> & Partial<PeriodCommitmentSnapshot>,
  periodKey: CommitmentPeriodKey
): BrandWorkspace {
  const prev = brand.commitments;
  const prevSnap = prev.periodHistory[periodKey];
  const storiesComm = patch.StoriesCommitted ?? patch.storiesCommitted ?? prevSnap.StoriesCommitted;
  const storiesComp = patch.StoriesCompleted ?? patch.storiesCompleted ?? prevSnap.StoriesCompleted;

  const updatedSnap: PeriodCommitmentSnapshot = {
    ...prevSnap,
    ...patch,
    period: periodKey,
    StoriesCommitted: storiesComm,
    storiesCommitted: storiesComm,
    StoriesCompleted: storiesComp,
    storiesCompleted: storiesComp,
  };

  const isCurrent = periodKey === "mes_actual";
  const nextCommitments: AccountCommitment = {
    ...prev,
    ...(isCurrent
      ? {
          postsCommitted: updatedSnap.postsCommitted,
          postsCompleted: updatedSnap.postsCompleted,
          StoriesCommitted: updatedSnap.StoriesCommitted,
          StoriesCompleted: updatedSnap.StoriesCompleted,
          storiesCommitted: updatedSnap.storiesCommitted,
          storiesCompleted: updatedSnap.storiesCompleted,
          reelsCommitted: updatedSnap.reelsCommitted,
          reelsCompleted: updatedSnap.reelsCompleted,
          adCampaignsCommitted: updatedSnap.adCampaignsCommitted,
          adCampaignsCompleted: updatedSnap.adCampaignsCompleted,
        }
      : {}),
    hasDeclaredCommitments: patch.hasDeclaredCommitments ?? true,
    customMetrics: patch.customMetrics ?? prev.customMetrics,
    periodHistory: {
      ...prev.periodHistory,
      [periodKey]: updatedSnap,
    },
  };

  return {
    ...brand,
    monthlyPostTarget: isCurrent ? nextCommitments.postsCommitted : brand.monthlyPostTarget,
    commitments: nextCommitments,
  };
}

/** Aplica una recomendación aceptada: solo cambia la métrica que recomienda, en el mes actual. */
export function applyRecommendationToBrand(
  brand: BrandWorkspace,
  rec: { metricKey: string; recommendedCommitted: number }
): BrandWorkspace {
  const prev = brand.commitments;
  const actual = prev.periodHistory.mes_actual;

  const nextPostsCommitted =
    rec.metricKey === "posts" ? rec.recommendedCommitted : prev.postsCommitted;
  const nextReelsCommitted =
    rec.metricKey === "reels" ? rec.recommendedCommitted : prev.reelsCommitted;
  const nextStoriesCommitted =
    rec.metricKey === "stories" ? rec.recommendedCommitted : prev.StoriesCommitted;
  const nextAdsCommitted =
    rec.metricKey === "ads" ? rec.recommendedCommitted : prev.adCampaignsCommitted;

  return {
    ...brand,
    monthlyPostTarget: nextPostsCommitted,
    commitments: {
      ...prev,
      postsCommitted: nextPostsCommitted,
      reelsCommitted: nextReelsCommitted,
      StoriesCommitted: nextStoriesCommitted,
      storiesCommitted: nextStoriesCommitted,
      adCampaignsCommitted: nextAdsCommitted,
      hasDeclaredCommitments: true,
      periodHistory: {
        ...prev.periodHistory,
        mes_actual: {
          ...actual,
          postsCommitted: nextPostsCommitted,
          reelsCommitted: nextReelsCommitted,
          StoriesCommitted: nextStoriesCommitted,
          storiesCommitted: nextStoriesCommitted,
          adCampaignsCommitted: nextAdsCommitted,
        },
      },
    },
  };
}
