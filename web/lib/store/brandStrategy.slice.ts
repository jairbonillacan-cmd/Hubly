import type { StateCreator } from "zustand";
import { createActivityItem } from "../domain/activity";
import { selectAccountRecommendations } from "../domain-selectors";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { AccountCommitment, CustomCommitmentMetric, PeriodCommitmentSnapshot } from "../types";

export type CommitmentPeriodKey = "mes_actual" | "mes_anterior" | "trimestre";

export interface BrandStrategySlice {
  togglePersonaAccepted: (brandId: string, personaId: string) => void;
  updateBrandCommitments: (
    brandId: string,
    patch: Partial<AccountCommitment> & Partial<PeriodCommitmentSnapshot>,
    periodKey?: CommitmentPeriodKey
  ) => void;
  setBrandCustomMetrics: (
    brandId: string,
    customMetrics: CustomCommitmentMetric[]
  ) => void;
  applyRecommendation: (recommendationId: string) => void;
  applyRecommendationsBatch: (recommendationIds?: string[]) => void;
  dismissRecommendation: (recommendationId: string) => void;
}

export const createBrandStrategySlice: StateCreator<HublyStoreState, [], [], BrandStrategySlice> = (set, get) => ({
  togglePersonaAccepted: (brandId, personaId) => {
    set((s) => ({
      brands: s.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              core: {
                ...b.core,
                personas: b.core.personas.map((p) =>
                  p.id === personaId ? { ...p, accepted: !p.accepted } : p
                ),
              },
            }
          : b
      ),
    }));
    persistWorkspaceState(get());
  },

  updateBrandCommitments: (brandId, patch, periodKey = "mes_actual") => {
    set((s) => {
      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId,
        metadata: { period: periodKey },
      });

      return {
        brands: s.brands.map((b) => {
          if (b.id !== brandId) return b;
          const prev = b.commitments;
          const prevSnap = prev.periodHistory[periodKey];
          const storiesComm =
            patch.StoriesCommitted ??
            patch.storiesCommitted ??
            prevSnap.StoriesCommitted;
          const storiesComp =
            patch.StoriesCompleted ??
            patch.storiesCompleted ??
            prevSnap.StoriesCompleted;

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
            ...b,
            monthlyPostTarget: isCurrent
              ? nextCommitments.postsCommitted
              : b.monthlyPostTarget,
            commitments: nextCommitments,
          };
        }),
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  setBrandCustomMetrics: (brandId, customMetrics) => {
    get().updateBrandCommitments(brandId, {
      customMetrics,
      hasDeclaredCommitments: true,
    });
  },

  applyRecommendation: (recommendationId) => {
    set((s) => {
      const allRecs = selectAccountRecommendations(
        s.brands,
        s.tasks,
        s.posts,
        s.dismissedRecommendationIds,
        s.appliedRecommendationsMap
      );
      const rec = allRecs.find((r) => r.id === recommendationId);
      if (!rec) return s;

      const nextBrands = s.brands.map((b) => {
        if (b.id !== rec.brandId) return b;
        const prev = b.commitments;
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
          ...b,
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
      });

      const event = createActivityItem(s, {
        type: "commitment_updated",
        brandId: rec.brandId,
        durationMinutes: 10,
        metadata: {
          recommendationId: rec.id,
          ruleId: rec.ruleId,
          recommendedCommitted: rec.recommendedCommitted,
        },
      });

      return {
        brands: nextBrands,
        appliedRecommendationsMap: {
          ...s.appliedRecommendationsMap,
          [recommendationId]: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  applyRecommendationsBatch: (recommendationIds) => {
    const state = get();
    const allRecs = selectAccountRecommendations(
      state.brands,
      state.tasks,
      state.posts,
      state.dismissedRecommendationIds,
      state.appliedRecommendationsMap
    );
    const targetIds =
      recommendationIds && recommendationIds.length > 0
        ? recommendationIds
        : allRecs.filter((r) => !r.applied).map((r) => r.id);

    for (const id of targetIds) {
      get().applyRecommendation(id);
    }
  },

  dismissRecommendation: (recommendationId) => {
    set((s) => ({
      dismissedRecommendationIds: s.dismissedRecommendationIds.includes(recommendationId)
        ? s.dismissedRecommendationIds
        : [...s.dismissedRecommendationIds, recommendationId],
    }));
    persistWorkspaceState(get());
  },
});
