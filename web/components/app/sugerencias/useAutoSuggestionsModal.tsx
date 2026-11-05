"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import {
  DEFAULT_METRICS,
  adjustRecommendationValue,
  buildEnrichedMetricsPayload,
  mapMetricKeyToCommitmentPatch,
  resolveEffectiveRecommendationValue,
  resolveRecommendationMetricTitle,
  selectAccountRecommendations,
  toggleSuggestedMetric,
  updateSuggestedMetricTarget,
  type SuggestedMetricItem,
} from "@/lib/domain/recommendations";
import type { AccountRecommendation } from "@/lib/types";

export interface AutoSuggestionsModalProps {
  open?: boolean;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApply?: (payload: any[]) => void;
}

export function useAutoSuggestionsModal({
  open: openProp,
  onClose: onCloseProp,
  onApply,
}: AutoSuggestionsModalProps = {}) {
  const titleId = useId();
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const dismissedRecommendationIds = useHublyStore(
    (s) => s.dismissedRecommendationIds
  );
  const appliedRecommendationsMap = useHublyStore(
    (s) => s.appliedRecommendationsMap
  );
  const applyRecommendation = useHublyStore((s) => s.applyRecommendation);
  const dismissRecommendation = useHublyStore((s) => s.dismissRecommendation);
  const applyRecommendationsBatch = useHublyStore(
    (s) => s.applyRecommendationsBatch
  );
  const updateBrandCommitments = useHublyStore(
    (s) => s.updateBrandCommitments
  );
  const autoSuggestionsModalOpen = useHublyStore(
    (s) => s.autoSuggestionsModalOpen
  );
  const setAutoSuggestionsModalOpen = useHublyStore(
    (s) => s.setAutoSuggestionsModalOpen
  );

  // Nunca se abre sola al montar salvo que ?modal=sugerencias esté en la URL o la persona lo pida.
  const [explicitlyUnlocked, setExplicitlyUnlocked] = useState(false);
  const prevOpenPropRef = useRef<boolean | undefined>(openProp);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "sugerencias") {
      setExplicitlyUnlocked(true); // eslint-disable-line react-hooks/set-state-in-effect -- la URL y el store abren la ventana
      setAutoSuggestionsModalOpen(true);
      return;
    }

    if (openProp === true && !autoSuggestionsModalOpen) {
      onCloseProp?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest("button, a");
      if (!btn) return;
      const text = (btn.textContent || "").toLowerCase();
      if (
        text.includes("sugerencias") ||
        text.includes("empezar") ||
        text.includes("editar metas") ||
        text.includes("compromisos")
      ) {
        setExplicitlyUnlocked(true);
      }
    };
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (autoSuggestionsModalOpen) {
      setExplicitlyUnlocked(true); // eslint-disable-line react-hooks/set-state-in-effect -- la URL y el store abren la ventana
    } else if (prevOpenPropRef.current === false && openProp === true) {
      setExplicitlyUnlocked(true);
    }
    prevOpenPropRef.current = openProp;
  }, [openProp, autoSuggestionsModalOpen]);

  const rawOpen =
    openProp !== undefined
      ? openProp || autoSuggestionsModalOpen
      : autoSuggestionsModalOpen;
  const isOpen = explicitlyUnlocked && rawOpen;

  const [activeView, setActiveView] = useState<"reglas" | "metricas">("reglas");
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [metrics, setMetrics] =
    useState<SuggestedMetricItem[]>(DEFAULT_METRICS);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const recommendations = selectAccountRecommendations(
    brands,
    tasks,
    posts,
    dismissedRecommendationIds,
    appliedRecommendationsMap
  );
  const pendingRecommendations = recommendations.filter((r) => !r.applied);

  const handleClose = () => {
    setFeedbackBanner(null);
    setAutoSuggestionsModalOpen(false);
    onCloseProp?.();
  };

  const handleAdjustValue = (rec: AccountRecommendation, delta: number) => {
    setCustomValues((prev) => adjustRecommendationValue(rec, prev, delta));
  };

  const handleApplySingle = (rec: AccountRecommendation) => {
    const chosenValue = resolveEffectiveRecommendationValue(rec, customValues);
    const metricTitle = resolveRecommendationMetricTitle(rec);
    applyRecommendation(rec.id);
    if (chosenValue !== rec.recommendedCommitted) {
      updateBrandCommitments(
        rec.brandId,
        mapMetricKeyToCommitmentPatch(rec.metricKey, chosenValue)
      );
    }
    setFeedbackBanner(
      `Se actualizó ${metricTitle.toLowerCase()} de ${rec.brandName} a ${chosenValue}/mes.`
    );
  };

  const handleDismissSingle = (rec: AccountRecommendation) => {
    const metricTitle = resolveRecommendationMetricTitle(rec);
    dismissRecommendation(rec.id);
    setFeedbackBanner(
      `Sugerencia descartada para ${rec.brandName} (${metricTitle}).`
    );
  };

  const handleApplyAll = () => {
    if (pendingRecommendations.length > 0) {
      const ids = pendingRecommendations.map((r) => r.id);
      applyRecommendationsBatch(ids);
      pendingRecommendations.forEach((rec) => {
        const chosenValue = resolveEffectiveRecommendationValue(rec, customValues);
        if (chosenValue !== rec.recommendedCommitted) {
          updateBrandCommitments(
            rec.brandId,
            mapMetricKeyToCommitmentPatch(rec.metricKey, chosenValue)
          );
        }
      });
    }

    const enrichedPayload = buildEnrichedMetricsPayload(metrics, brands);
    if (onApply && enrichedPayload.length > 0) {
      onApply(enrichedPayload);
    }

    handleClose();
  };

  const toggleMetricChecked = (id: string) => {
    setMetrics((prev) => toggleSuggestedMetric(prev, id));
  };

  const updateMetricTarget = (id: string, value: string) => {
    setMetrics((prev) => updateSuggestedMetricTarget(prev, id, value));
  };

  return {
    titleId,
    brandsCount: brands.length,
    isOpen,
    activeView,
    setActiveView,
    customValues,
    metrics,
    feedbackBanner,
    pendingRecommendations,
    handleClose,
    handleAdjustValue,
    handleApplySingle,
    handleDismissSingle,
    handleApplyAll,
    toggleMetricChecked,
    updateMetricTarget,
  };
}
