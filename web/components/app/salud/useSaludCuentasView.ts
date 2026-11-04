"use client";

import { useEffect, useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import {
  buildCommitmentSavePayload,
  createCommitmentDraft,
  selectAccountRecommendations,
  selectAccountsHealth,
  sortEvaluatedAccounts,
  type AccountHealthSortBy,
  type AccountsHealthFilter,
  type CommitmentDraft,
  type EvaluatedBrandAccount,
} from "@/lib/domain-selectors";
import type { AccountRecommendation, CommitmentPeriod } from "@/lib/types";

export const PERIOD_OPTIONS: { id: CommitmentPeriod; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "semana", label: "Esta semana" },
  { id: "mes_actual", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "trimestre", label: "Trimestre" },
];

export function useSaludCuentasView() {
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const testClock = useHublyStore((s) => s.testClock);
  const dismissedRecommendationIds = useHublyStore((s) => s.dismissedRecommendationIds);
  const appliedRecommendationsMap = useHublyStore((s) => s.appliedRecommendationsMap);

  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setAutoSuggestionsModalOpen = useHublyStore((s) => s.setAutoSuggestionsModalOpen);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updateBrandCommitments = useHublyStore((s) => s.updateBrandCommitments);
  const setBrandCustomMetrics = useHublyStore((s) => s.setBrandCustomMetrics);
  const applyRecommendation = useHublyStore((s) => s.applyRecommendation);
  const applyRecommendationsBatch = useHublyStore((s) => s.applyRecommendationsBatch);
  const dismissRecommendation = useHublyStore((s) => s.dismissRecommendation);

  const [period, setPeriod] = useState<CommitmentPeriod>("mes_actual");
  const [activeFilter, setActiveFilter] = useState<AccountsHealthFilter>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<AccountHealthSortBy>("health_desc");
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [draftCommitments, setDraftCommitments] = useState<CommitmentDraft | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // El modal de sugerencias solo se abre si la URL lo pide: ?modal=sugerencias
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "sugerencias") {
      setAutoSuggestionsModalOpen(true);
    } else if (useHublyStore.getState().autoSuggestionsModalOpen) {
      setAutoSuggestionsModalOpen(false);
    }
  }, [setAutoSuggestionsModalOpen]);

  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = setTimeout(() => setFeedbackBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [feedbackBanner]);

  const healthData = useMemo(() => {
    const result = selectAccountsHealth(brands, tasks, posts, {
      period,
      filter: activeFilter,
      searchQuery,
      sortBy,
      referenceNow: testClock,
    });
    return {
      ...result,
      accounts: sortEvaluatedAccounts(result.accounts, sortBy),
    };
  }, [brands, tasks, posts, period, activeFilter, searchQuery, sortBy, testClock]);

  const recommendations = useMemo(
    () =>
      selectAccountRecommendations(
        brands,
        tasks,
        posts,
        dismissedRecommendationIds,
        appliedRecommendationsMap
      ),
    [brands, tasks, posts, dismissedRecommendationIds, appliedRecommendationsMap]
  );

  const periodLabel = (PERIOD_OPTIONS.find((p) => p.id === period) ?? PERIOD_OPTIONS[3]).label;
  const hasActiveFilters = activeFilter !== "todas" || searchQuery.trim() !== "";

  function handleStartEditCommitments(account: EvaluatedBrandAccount) {
    if (editingBrandId === account.brand.id) {
      setEditingBrandId(null);
      setDraftCommitments(null);
      return;
    }
    setEditingBrandId(account.brand.id);
    setDraftCommitments(createCommitmentDraft(account));
  }

  function handleCancelEdit() {
    setEditingBrandId(null);
    setDraftCommitments(null);
  }

  function handleSaveCommitments(brandId: string, brandName: string) {
    if (!draftCommitments) return;
    const { brandPatch, commitmentsPatch, targetPeriodKey } = buildCommitmentSavePayload(
      draftCommitments,
      period
    );
    updateBrand(brandId, brandPatch);
    updateBrandCommitments(brandId, commitmentsPatch, targetPeriodKey);
    setBrandCustomMetrics(brandId, draftCommitments.customMetrics);
    setEditingBrandId(null);
    setDraftCommitments(null);
    setFeedbackBanner(`Compromisos de ${brandName} guardados (${periodLabel}).`);
  }

  function handleApplySingleRecommendation(rec: AccountRecommendation) {
    applyRecommendation(rec.id);
    setFeedbackBanner(
      `Sugerencia aplicada en ${rec.brandName}: ${rec.title} (${rec.currentCommitted} → ${rec.recommendedCommitted}).`
    );
  }

  function handleDismissSingleRecommendation(rec: AccountRecommendation) {
    dismissRecommendation(rec.id);
    setFeedbackBanner(`Sugerencia descartada para ${rec.brandName}.`);
  }

  function handleApplyAllRecommendations() {
    if (recommendations.length === 0) return;
    const count = recommendations.length;
    applyRecommendationsBatch(recommendations.map((r) => r.id));
    setFeedbackBanner(`Se aplicaron ${count} sugerencias en tus cuentas.`);
  }

  function handleClearFilters() {
    setActiveFilter("todas");
    setSearchQuery("");
  }

  return {
    accounts: healthData.accounts,
    summary: healthData.summary,
    recommendations,
    activeBrandId,
    period,
    setPeriod,
    periodLabel,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    hasActiveFilters,
    editingBrandId,
    draftCommitments,
    setDraftCommitments,
    feedbackBanner,
    onOpenNewBrand: () => setNewBrandModalOpen(true),
    onOpenSuggestionsModal: () => setAutoSuggestionsModalOpen(true),
    handleStartEditCommitments,
    handleCancelEdit,
    handleSaveCommitments,
    handleApplySingleRecommendation,
    handleDismissSingleRecommendation,
    handleApplyAllRecommendations,
    handleClearFilters,
  };
}
