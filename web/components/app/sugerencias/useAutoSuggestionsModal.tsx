"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import { selectAccountRecommendations } from "@/lib/domain-selectors";
import type {
  AccountRecommendation,
} from "@/lib/types";
import { SuggestedMetricItem, AutoSuggestionsModalProps, DEFAULT_METRICS, METRIC_KEY_LABELS, mapMetricKeyToCommitmentPatch, getFocusableElements, } from "./AutoSuggestionsModal-shared";

export function useAutoSuggestionsModal({
  open: openProp,
  onClose: onCloseProp,
  onApply,
}: AutoSuggestionsModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
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
  // Enforce contract: NEVER auto-open on page mount unless ?modal=sugerencias is present or user explicitly triggered it
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

    // If parent passed open={true} on initial mount without ?modal=sugerencias, close it immediately
    if (openProp === true && !autoSuggestionsModalOpen) {
      onCloseProp?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Listen for explicit trigger clicks on the page ("Sugerencias automáticas", "Revisar sugerencias", "Empezar", "Editar metas")
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
  // Unlock if openProp transitions from false -> true or store flag becomes true
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
  // Focus trap, Escape key, Initial focus & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      if (firstActionRef.current) {
        firstActionRef.current.focus();
      } else {
        const focusables = getFocusableElements(dialogRef.current);
        focusables[0]?.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      const remainingDialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (remainingDialogs.length <= 1) {
        document.body.style.overflow = prevOverflow || "";
      }
      const prevEl = previousActiveElementRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        window.requestAnimationFrame(() => {
          prevEl.focus();
        });
      }
    };
  }, [isOpen]);
  const presence = useModalPresence(isOpen);

  return { openProp, onCloseProp, onApply, titleId, dialogRef, firstActionRef, previousActiveElementRef, brands, tasks, posts, dismissedRecommendationIds, appliedRecommendationsMap, applyRecommendation, dismissRecommendation, applyRecommendationsBatch, updateBrandCommitments, autoSuggestionsModalOpen, setAutoSuggestionsModalOpen, explicitlyUnlocked, setExplicitlyUnlocked, prevOpenPropRef, rawOpen, isOpen, activeView, setActiveView, customValues, setCustomValues, metrics, setMetrics, feedbackBanner, setFeedbackBanner, recommendations, pendingRecommendations, handleClose, presence };
}

type useAutoSuggestionsModalResult = ReturnType<typeof useAutoSuggestionsModal>;

/** Lo que se calcula tras comprobar que la ventana está lista. No usa hooks. */
export function buildAutoSuggestionsModal(base: useAutoSuggestionsModalResult) {
  const { onApply, brands, applyRecommendation, dismissRecommendation, applyRecommendationsBatch, updateBrandCommitments, customValues, setCustomValues, metrics, setMetrics, setFeedbackBanner, pendingRecommendations, handleClose } = base;
  const getEffectiveValue = (rec: AccountRecommendation) =>
    customValues[rec.id] !== undefined
      ? customValues[rec.id]
      : rec.recommendedCommitted;
  const getMetricTitle = (rec: AccountRecommendation) =>
    rec.metricTitle || METRIC_KEY_LABELS[rec.metricKey] || "Compromiso mensual";
  const handleAdjustValue = (rec: AccountRecommendation, delta: number) => {
    const current = getEffectiveValue(rec);
    const next = Math.max(1, current + delta);
    setCustomValues((prev) => ({ ...prev, [rec.id]: next }));
  };
  const handleApplySingle = (rec: AccountRecommendation) => {
    const chosenValue = getEffectiveValue(rec);
    applyRecommendation(rec.id);
    if (chosenValue !== rec.recommendedCommitted) {
      updateBrandCommitments(
        rec.brandId,
        mapMetricKeyToCommitmentPatch(rec.metricKey, chosenValue)
      );
    }
    setFeedbackBanner(
      `Se actualizó ${getMetricTitle(rec).toLowerCase()} de ${rec.brandName} a ${chosenValue}/mes.`
    );
  };
  const handleDismissSingle = (rec: AccountRecommendation) => {
    dismissRecommendation(rec.id);
    setFeedbackBanner(
      `Sugerencia descartada para ${rec.brandName} (${getMetricTitle(rec)}).`
    );
  };
  const handleApplyAll = () => {
    if (pendingRecommendations.length > 0) {
      const ids = pendingRecommendations.map((r) => r.id);
      applyRecommendationsBatch(ids);
      pendingRecommendations.forEach((rec) => {
        const chosenValue = getEffectiveValue(rec);
        if (chosenValue !== rec.recommendedCommitted) {
          updateBrandCommitments(
            rec.brandId,
            mapMetricKeyToCommitmentPatch(rec.metricKey, chosenValue)
          );
        }
      });
    }

    const selectedMetrics = metrics.filter((m) => m.checked);
    if (onApply && selectedMetrics.length > 0) {
      // Support both SuggestedMetricItem[] (dashboard/page.tsx) and BrandConfig[] (SaludCuentasView.tsx)
      const enrichedPayload = selectedMetrics.map((m) => {
        const firstBrand = brands[0];
        return {
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
        };
      });
      onApply(enrichedPayload);
    }

    handleClose();
  };
  const toggleMetricChecked = (id: string) => {
    setMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };
  const updateMetricTarget = (id: string, value: string) => {
    setMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, target: value } : m))
    );
  };

  return { ...base, getEffectiveValue, getMetricTitle, handleAdjustValue, handleApplySingle, handleDismissSingle, handleApplyAll, toggleMetricChecked, updateMetricTarget };
}

export type AutoSuggestionsModalModel = ReturnType<typeof buildAutoSuggestionsModal>;
