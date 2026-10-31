"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  selectAccountsHealth,
  selectAccountRecommendations,
  type AccountsHealthFilter,
  type EvaluatedBrandAccount,
} from "@/lib/domain-selectors";
import type {
  BrandHealthStatus,
  CommitmentPeriod,
  CustomCommitmentMetric,
  AccountRecommendation,
} from "@/lib/types";
import {
  AutoSuggestionsModal,
  type BrandConfig,
} from "@/components/app/AutoSuggestionsModal";

// ─── Period Configuration ──────────────────────────────────────────────────

interface PeriodOption {
  id: CommitmentPeriod;
  label: string;
  shortLabel: string;
  badgeText: string;
}

const QUICK_PERIOD_IDS: CommitmentPeriod[] = ["7d", "30d", "semana", "mes_actual", "custom"];

const METRIC_TEMPLATES: { label: string; items: { name: string; unit: "semana" | "mes" | "total" }[] }[] = [
  {
    label: "Contenido",
    items: [
      { name: "Posts en feed", unit: "semana" },
      { name: "Reels publicados", unit: "semana" },
      { name: "Stories publicadas", unit: "semana" },
      { name: "Carruseles publicados", unit: "mes" },
      { name: "Sesiones de foto o video", unit: "mes" },
      { name: "Blogs publicados", unit: "mes" },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { name: "Comentarios respondidos", unit: "semana" },
      { name: "Mensajes respondidos", unit: "semana" },
      { name: "Colaboraciones con creadores", unit: "mes" },
      { name: "Nuevos seguidores", unit: "mes" },
    ],
  },
  {
    label: "Pauta",
    items: [
      { name: "Campañas activas", unit: "mes" },
      { name: "Creativos nuevos", unit: "mes" },
      { name: "Leads generados", unit: "mes" },
      { name: "Ventas atribuidas", unit: "mes" },
    ],
  },
  {
    label: "Cliente",
    items: [
      { name: "Reportes entregados", unit: "mes" },
      { name: "Juntas de seguimiento", unit: "mes" },
      { name: "Parrillas aprobadas", unit: "mes" },
    ],
  },
];

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    id: "semana",
    label: "Esta semana",
    shortLabel: "Esta semana",
    badgeText: "Ritmo de la semana en curso",
  },
  {
    id: "custom",
    label: "Custom",
    shortLabel: "Custom",
    badgeText: "Referencia: acumulado trimestral",
  },
  {
    id: "mes_actual",
    label: "Este mes",
    shortLabel: "Este mes",
    badgeText: "Ciclo mensual en curso",
  },
  {
    id: "mes_anterior",
    label: "Mes anterior",
    shortLabel: "Mes anterior",
    badgeText: "Cierre del mes pasado",
  },
  {
    id: "trimestre",
    label: "Trimestre",
    shortLabel: "Trimestre",
    badgeText: "Acumulado trimestral (Q)",
  },
  {
    id: "30d",
    label: "30 días",
    shortLabel: "30 días",
    badgeText: "Ventana móvil 30 días",
  },
  {
    id: "7d",
    label: "7 días",
    shortLabel: "7 días",
    badgeText: "Ritmo semanal (7 días)",
  },
];

type SortOptionId =
  | "health_desc"
  | "health_asc"
  | "name_asc"
  | "budget_desc"
  | "fulfillment_desc";

const SORT_OPTIONS: { id: SortOptionId; label: string }[] = [
  { id: "health_desc", label: "Salud: Mayor a menor" },
  { id: "health_asc", label: "Salud: Menor a mayor" },
  { id: "fulfillment_desc", label: "% Cumplimiento" },
  { id: "budget_desc", label: "Mayor inversión pauta" },
  { id: "name_asc", label: "Nombre (A–Z)" },
];

interface CommitmentDraft {
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

function getStatusStyles(status: BrandHealthStatus) {
  if (status === "completa") {
    return {
      label: "Completa",
      color: "#059669",
      dot: "#10B981",
      bg: "#ECFDF5",
      border: "#A7F3D0",
      barColor: "#10B981",
    };
  }
  if (status === "en_riesgo") {
    return {
      label: "En riesgo",
      color: "#DC2626",
      dot: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
      barColor: "#EF4444",
    };
  }
  return {
    label: "En progreso",
    color: "var(--ui-accent-text-2)",
    dot: "var(--hb-accent)",
    bg: "#F1F9FD",
    border: "#BFE2F4",
    barColor: "var(--hb-accent)",
  };
}

function getPriorityStyles(priority?: "alta" | "media" | "baja" | "Alta" | "Media" | "Baja") {
  const norm = (priority || "media").toLowerCase();
  if (norm === "alta") {
    return {
      label: "Prioridad alta",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }
  if (norm === "media") {
    return {
      label: "Prioridad media",
      color: "var(--ui-accent-text-2)",
      bg: "#F1F9FD",
      border: "#BFE2F4",
    };
  }
  return {
    label: "Oportunidad",
    color: "var(--hb-accent-text)",
    bg: "#EAF6FC",
    border: "#BFE2F4",
  };
}

export function SaludCuentasView() {
  // ── Store bindings ──────────────────────────────────────────────────────
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const testClock = useHublyStore((s) => s.testClock);
  const autoSuggestionsModalOpen = useHublyStore(
    (s) => s.autoSuggestionsModalOpen
  );
  const dismissedRecommendationIds = useHublyStore(
    (s) => s.dismissedRecommendationIds
  );
  const appliedRecommendationsMap = useHublyStore(
    (s) => s.appliedRecommendationsMap
  );

  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setAutoSuggestionsModalOpen = useHublyStore(
    (s) => s.setAutoSuggestionsModalOpen
  );
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updateBrandCommitments = useHublyStore(
    (s) => s.updateBrandCommitments
  );
  const setBrandCustomMetrics = useHublyStore((s) => s.setBrandCustomMetrics);
  const applyRecommendation = useHublyStore((s) => s.applyRecommendation);
  const applyRecommendationsBatch = useHublyStore(
    (s) => s.applyRecommendationsBatch
  );
  const dismissRecommendation = useHublyStore((s) => s.dismissRecommendation);

  // ── View Local State ────────────────────────────────────────────────────
  const [period, setPeriod] = useState<CommitmentPeriod>("mes_actual");
  const [activeFilter, setActiveFilter] =
    useState<AccountsHealthFilter>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOptionId>("health_desc");
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const periodMenuPresence = useModalPresence(periodDropdownOpen, 100);
  const sortMenuPresence = useModalPresence(sortDropdownOpen, 100);
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [draftCommitments, setDraftCommitments] =
    useState<CommitmentDraft | null>(null);
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState<
    "semana" | "mes" | "total"
  >("semana");
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  // ── Strictly forbid automatic modal opening on tab switch ───────────────
  // Only open AutoSuggestionsModal if the URL explicitly passes ?modal=sugerencias
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "sugerencias") {
      setAutoSuggestionsModalOpen(true);
    } else if (autoSuggestionsModalOpen) {
      // Ensure entering the view from another tab never auto-opens the modal
      setAutoSuggestionsModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        periodMenuRef.current &&
        !periodMenuRef.current.contains(e.target as Node)
      ) {
        setPeriodDropdownOpen(false);
      }
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = setTimeout(() => setFeedbackBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [feedbackBanner]);

  // ── Derived Domain State via Selectors ──────────────────────────────────
  const healthData = useMemo(() => {
    const result = selectAccountsHealth(brands, tasks, posts, {
      period,
      filter: activeFilter,
      searchQuery,
      sortBy,
      referenceNow: testClock,
    });

    if (sortBy === "name_asc") {
      return {
        ...result,
        accounts: [...result.accounts].sort((a, b) =>
          a.brand.name.localeCompare(b.brand.name, "es")
        ),
      };
    }
    return result;
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
    [
      brands,
      tasks,
      posts,
      dismissedRecommendationIds,
      appliedRecommendationsMap,
    ]
  );

  const { accounts, allEvaluatedAccounts, summary } = healthData;

  const activePeriodOption =
    PERIOD_OPTIONS.find((p) => p.id === period) || PERIOD_OPTIONS[0];
  const activeSortOption =
    SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  // Representative preview account for the 1:1 onboarding card
  const featuredPreviewAccount = useMemo(() => {
    return (
      allEvaluatedAccounts.find((a) => a.brand.id === activeBrandId) ||
      allEvaluatedAccounts[0] ||
      null
    );
  }, [allEvaluatedAccounts, activeBrandId]);

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleOpenAutoSuggestions() {
    setAutoSuggestionsModalOpen(true);
  }

  function handleStartEditCommitments(account: EvaluatedBrandAccount) {
    if (editingBrandId === account.brand.id) {
      setEditingBrandId(null);
      setDraftCommitments(null);
      return;
    }
    const { snapshot, customMetrics } = account;
    setEditingBrandId(account.brand.id);
    setDraftCommitments({
      postsCommitted: snapshot.postsCommitted,
      postsCompleted: snapshot.postsCompleted,
      StoriesCommitted:
        snapshot.StoriesCommitted ?? snapshot.storiesCommitted ?? 16,
      StoriesCompleted:
        snapshot.StoriesCompleted ?? snapshot.storiesCompleted ?? 14,
      reelsCommitted: snapshot.reelsCommitted,
      reelsCompleted: snapshot.reelsCompleted,
      adCampaignsCommitted: snapshot.adCampaignsCommitted,
      adCampaignsCompleted: snapshot.adCampaignsCompleted,
      hasPaidAds: account.hasPaidAds,
      monthlySpend: account.brand.monthlySpend ?? snapshot.adSpend ?? 0,
      customMetrics: customMetrics.map((m) => ({ ...m })),
    });
    setNewMetricName("");
    setNewMetricValue("");
  }

  function handleSaveCommitments(brandId: string, brandName: string) {
    if (!draftCommitments) return;

    const targetPeriodKey: "mes_actual" | "mes_anterior" | "trimestre" =
      period === "mes_anterior"
        ? "mes_anterior"
        : period === "trimestre"
        ? "trimestre"
        : "mes_actual";

    // If user is editing while viewing 7d window, scale 7d values by 4 when saving to mes_actual snapshot
    const multiplier = period === "7d" ? 4 : 1;

    const postsCommitted = Math.max(
      0,
      Math.round(draftCommitments.postsCommitted * multiplier)
    );
    const postsCompleted = Math.max(
      0,
      Math.round(draftCommitments.postsCompleted * multiplier)
    );
    const StoriesCommitted = Math.max(
      0,
      Math.round(draftCommitments.StoriesCommitted * multiplier)
    );
    const StoriesCompleted = Math.max(
      0,
      Math.round(draftCommitments.StoriesCompleted * multiplier)
    );
    const reelsCommitted = Math.max(
      0,
      Math.round(draftCommitments.reelsCommitted * multiplier)
    );
    const reelsCompleted = Math.max(
      0,
      Math.round(draftCommitments.reelsCompleted * multiplier)
    );
    const adCampaignsCommitted = Math.max(
      0,
      Math.round(draftCommitments.adCampaignsCommitted)
    );
    const adCampaignsCompleted = Math.max(
      0,
      Math.round(draftCommitments.adCampaignsCompleted)
    );

    updateBrand(brandId, {
      hasPaidAds: draftCommitments.hasPaidAds,
      monthlySpend: Math.max(0, Number(draftCommitments.monthlySpend) || 0),
    });

    updateBrandCommitments(
      brandId,
      {
        hasDeclaredCommitments: true,
        postsCommitted,
        postsCompleted,
        StoriesCommitted,
        StoriesCompleted,
        storiesCommitted: StoriesCommitted,
        storiesCompleted: StoriesCompleted,
        reelsCommitted,
        reelsCompleted,
        adCampaignsCommitted,
        adCampaignsCompleted,
        adSpend: draftCommitments.hasPaidAds
          ? Math.max(0, Number(draftCommitments.monthlySpend) || 0)
          : 0,
        customMetrics: draftCommitments.customMetrics,
      },
      targetPeriodKey
    );

    setBrandCustomMetrics(brandId, draftCommitments.customMetrics);
    setEditingBrandId(null);
    setDraftCommitments(null);
    setFeedbackBanner(
      `Compromisos de ${brandName} actualizados (${activePeriodOption.label}).`
    );
  }

  function handleAddDraftCustomMetric() {
    if (!draftCommitments || !newMetricName.trim()) return;
    const numericVal = Number(newMetricValue);
    const metric: CustomCommitmentMetric = {
      id: `cm-${Date.now()}`,
      name: newMetricName.trim(),
      value: Number.isFinite(numericVal) && numericVal >= 0 ? numericVal : 10,
      unit: newMetricUnit,
    };
    setDraftCommitments({
      ...draftCommitments,
      customMetrics: [...draftCommitments.customMetrics, metric],
    });
    setNewMetricName("");
    setNewMetricValue("");
  }

  function handleRemoveDraftCustomMetric(metricId: string) {
    if (!draftCommitments) return;
    setDraftCommitments({
      ...draftCommitments,
      customMetrics: draftCommitments.customMetrics.filter(
        (m) => m.id !== metricId
      ),
    });
  }

  function handleApplySingleRecommendation(rec: AccountRecommendation) {
    applyRecommendation(rec.id);
    setFeedbackBanner(
      `Sugerencia aplicada en ${rec.brandName}: ${rec.title} (${rec.currentCommitted} -> ${rec.recommendedCommitted}).`
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
    setFeedbackBanner(
      `Se aplicaron ${count} sugerencias automáticas en tus cuentas.`
    );
  }

  function handleModalApply(configs: BrandConfig[]) {
    const targetPeriodKey: "mes_actual" | "mes_anterior" | "trimestre" =
      period === "mes_anterior"
        ? "mes_anterior"
        : period === "trimestre"
        ? "trimestre"
        : "mes_actual";

    configs.forEach((cfg) => {
      const spendNum =
        Number(String(cfg.monthlySpend).replace(/[^0-9.]/g, "")) || 0;
      const mappedMetrics: CustomCommitmentMetric[] = cfg.metrics.map((m) => ({
        id: m.id,
        name: m.name,
        value: Number(m.target) || 0,
        unit:
          m.unit === "por mes"
            ? "mes"
            : m.unit === "por campaña"
            ? "total"
            : "semana",
      }));

      updateBrand(cfg.id, {
        hasPaidAds: cfg.runsPaidAds,
        monthlySpend: cfg.runsPaidAds ? spendNum : 0,
      });

      updateBrandCommitments(
        cfg.id,
        {
          hasDeclaredCommitments: true,
          postsCommitted: cfg.commitments.Publicaciones,
          StoriesCommitted: cfg.commitments.Stories,
          storiesCommitted: cfg.commitments.Stories,
          reelsCommitted: cfg.commitments.Reels,
          adCampaignsCommitted: cfg.commitments["Campañas Ads"],
          adSpend: cfg.runsPaidAds ? spendNum : 0,
          customMetrics: mappedMetrics,
        },
        targetPeriodKey
      );
    });

    if (recommendations.length > 0) {
      applyRecommendationsBatch(recommendations.map((r) => r.id));
    }

    setAutoSuggestionsModalOpen(false);
    setFeedbackBanner(
      "Configuración y sugerencias automáticas aplicadas a tus marcas."
    );
  }

  function handleClearFilters() {
    setActiveFilter("todas");
    setSearchQuery("");
  }

  // Filter pill definitions with live counters from selectAccountsHealth summary
  const filterPills: {
    id: AccountsHealthFilter;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { id: "todas", label: "Todas", count: summary.totalAccounts },
    {
      id: "con_pauta",
      label: "Con pauta",
      count: summary.withPaidAdsCount,
      dotColor: "var(--hb-accent)",
    },
    {
      id: "sin_pauta",
      label: "Sin pauta",
      count: summary.withoutPaidAdsCount,
      dotColor: "#9CA3AF",
    },
    {
      id: "en_riesgo",
      label: "En riesgo",
      count: summary.atRiskCount,
      dotColor: "#EF4444",
    },
    {
      id: "completas",
      label: "Completas",
      count: summary.completeCount,
      dotColor: "#10B981",
    },
  ];

  return (
    <div
      className="tablero-aparece"
      data-testid="salud-cuentas-view"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        maxWidth: 1240,
        margin: "0 auto",
        minWidth: 0,
        paddingBottom: 36,
      }}
    >
      {/* ── Feedback Notification Toast ─────────────────────────────────── */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 12,
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                flexShrink: 0,
              }}
            />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#047857",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1,
              padding: "2px 6px",
            }}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      {/* ── 1:1 Hero Card: Declara qué medir en tus marcas + Sugerencias ── */}
      <section
        aria-label="Configuración inicial y sugerencias automáticas de cuentas"
        style={{
          background: "var(--ui-surface)",
          border: "1.5px solid #BFE2F4",
          borderRadius: 18,
          padding: "clamp(16px, 2.5vw, 26px)",
          boxShadow: "0 6px 24px rgb(var(--hb-accent-rgb) / 0.08)",
          position: "relative",
          minWidth: 0,
        }}
      >
        {/* Top badges row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#E6F4FB",
                color: "var(--ui-accent-text)",
                border: "1px solid #BFE2F4",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Configuración inicial · 2 min por marca
            </span>

            <span
              data-testid="suggestions-count-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                border: "1px solid #BFE2F4",
                borderRadius: 999,
                padding: "4px 11px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {recommendations.length} sugerencias automáticas activas
            </span>

            {summary.uncommittedBrandsCount > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {summary.uncommittedBrandsCount} sin compromisos declarados
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="hbtn"
              onClick={handleOpenAutoSuggestions}
              data-testid="open-suggestions-modal-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 9,
                border: "1px solid #BFE2F4",
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span>Revisar sugerencias</span>
              <span
                style={{
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  borderRadius: 999,
                  padding: "1px 7px",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {recommendations.length}
              </span>
            </button>
          </div>
        </div>

        {/* Title & Description matching 02-dashboard-cuentas-1440.png */}
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "clamp(18px, 2.2vw, 22px)",
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          Declara qué medir en tus marcas
        </h1>
        <p
          style={{
            margin: "0 0 18px 0",
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.55,
            maxWidth: 740,
          }}
        >
          Define el compromiso mensual o semanal de publicaciones con cada
          cliente y si maneja pauta. Con eso Hubly calcula automáticamente el{" "}
          <strong style={{ color: "#111827", fontWeight: 700 }}>
            % de cumplimiento
          </strong>{" "}
          y el{" "}
          <strong style={{ color: "#111827", fontWeight: 700 }}>
            nivel de salud
          </strong>{" "}
          de cada cuenta.
        </p>

        {/* Featured Brand Preview Card (1:1 with reference screenshot) */}
        {featuredPreviewAccount && (
          <div
            style={{
              background: "var(--ui-surface)",
              border: "1px solid #E3E9EF",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
                flex: "1 1 240px",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: featuredPreviewAccount.brand.color || "#10B981",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {featuredPreviewAccount.brand.initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {featuredPreviewAccount.brand.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: featuredPreviewAccount.hasPaidAds
                      ? "var(--hb-accent-hover)"
                      : "#6B7280",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 4,
                  }}
                >
                  {featuredPreviewAccount.hasPaidAds ? (
                    <>
                      <span>🎯 Esta marca pauta · Pauta activa · gastó</span>
                      <strong style={{ color: "var(--ui-accent-text)" }}>
                        $
                        {(
                          featuredPreviewAccount.brand.monthlySpend ||
                          featuredPreviewAccount.snapshot.adSpend ||
                          8345
                        ).toLocaleString("en-US")}
                      </strong>
                      <span>este mes</span>
                    </>
                  ) : (
                    <span>
                      Orgánico · {featuredPreviewAccount.fulfillmentPercent}%
                      cumplimiento en {activePeriodOption.label.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {featuredPreviewAccount.customMetrics.map((metric) => (
                <span
                  key={metric.id}
                  style={{
                    background: "#F1F9FD",
                    color: "var(--ui-accent-text)",
                    border: "1px solid #BFE2F4",
                    borderRadius: 7,
                    padding: "4px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {metric.name} / {metric.unit}: {metric.value}
                </span>
              ))}
              <span
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                  borderRadius: 7,
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Salud {featuredPreviewAccount.healthScore}%
              </span>
            </div>
          </div>
        )}

        {/* Primary CTA Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <button
              type="button"
              className="hbtn"
              onClick={handleOpenAutoSuggestions}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--hb-accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgb(var(--hb-accent-rgb) / 0.3)",
              }}
            >
              <span>Empezar →</span>
            </button>

            <button
              type="button"
              className="hbtn"
              onClick={handleOpenAutoSuggestions}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--ui-surface)",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span>Sugerencias automáticas ({recommendations.length})</span>
            </button>

            <button
              type="button"
              className="hbtn"
              onClick={() => setShowRulesPanel((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                color: "#6B7280",
                border: "1px dashed #D1D5DB",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>
                {showRulesPanel
                  ? "Ocultar reglas activas"
                  : `Ver reglas activas (${recommendations.length})`}
              </span>
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#6B7280",
              fontWeight: 600,
            }}
          >
            <span>Salud promedio del portafolio:</span>
            <strong
              data-testid="average-health-score"
              style={{
                color:
                  summary.averageHealthScore >= 85
                    ? "#059669"
                    : summary.averageHealthScore >= 60
                    ? "var(--hb-accent-hover)"
                    : "#DC2626",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {summary.averageHealthScore}%
            </strong>
          </div>
        </div>
      </section>

      {/* ── KPI Summary Strip & Period Controls ─────────────────────────── */}
      <section
        aria-label="Resumen de salud y controles de periodo"
        style={{
          background: "var(--ui-surface)",
          border: "1px solid #EAECEF",
          borderRadius: 16,
          padding: "16px 18px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 0,
        }}
      >
        {/* Header Row: Title + Period Selector + New Brand Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Estado operativo de cuentas
              </h2>
              <span
                style={{
                  background: "#F3F4F6",
                  color: "#4B5563",
                  borderRadius: 999,
                  padding: "2px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {activePeriodOption.label} · {activePeriodOption.badgeText}
              </span>
            </div>
            <p
              style={{
                margin: "3px 0 0 0",
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              Cumplimiento real de entregables frente a metas comprometidas en
              el periodo seleccionado
            </p>
          </div>

          {/* Right Controls: Period Segmented Selector + Dropdown + New Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {/* Quick Period Buttons for 1-click period switching */}
            <div
              role="group"
              aria-label="Selector rápido de periodo"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                background: "#F3F4F6",
                padding: 3,
                borderRadius: 10,
                gap: 2,
              }}
            >
              {QUICK_PERIOD_IDS.flatMap((id) => PERIOD_OPTIONS.filter((opt) => opt.id === id)).map((opt) => {
                const isSelected = period === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriod(opt.id)}
                    aria-pressed={isSelected}
                    data-testid={`period-btn-${opt.id}`}
                    className="hubly-seg-pill"
                    style={{
                      border: "none",
                      borderRadius: 7,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 600,
                      background: isSelected ? "var(--ui-surface)" : "transparent",
                      color: isSelected ? "#111827" : "#6B7280",
                      boxShadow: isSelected
                        ? "0 1px 3px rgba(0,0,0,0.08)"
                        : "none",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Accessible Period Dropdown Selector */}
            <div ref={periodMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="hbtn"
                onClick={() => setPeriodDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={periodDropdownOpen}
                aria-label={`Periodo: ${activePeriodOption.label}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  background: "var(--ui-surface)",
                  color: "#374151",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>📅 {activePeriodOption.label}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>▾</span>
              </button>

              {periodMenuPresence.mounted && (
                <div
                  role="listbox"
                  aria-label="Seleccionar periodo"
                  className="hubly-dropdown"
                  data-state={periodMenuPresence.state}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    zIndex: 40,
                    background: "var(--ui-surface)",
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    padding: 6,
                    minWidth: 210,
                  }}
                >
                  {PERIOD_OPTIONS.map((opt) => {
                    const active = opt.id === period;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setPeriod(opt.id);
                          setPeriodDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: active ? "var(--ui-accent-soft)" : "transparent",
                          color: active ? "var(--hb-accent-text)" : "#111827",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          {opt.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: active ? "#16324F" : "#9CA3AF",
                          }}
                        >
                          {opt.badgeText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className="hbtn"
              onClick={() => setNewBrandModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 9,
                border: "none",
                background: "var(--hb-accent)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgb(var(--hb-accent-rgb) / 0.25)",
              }}
            >
              <span>+ Nueva marca</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #EAECEF",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
              Total cuentas
            </div>
            <div
              data-testid="kpi-total-accounts"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                marginTop: 2,
              }}
            >
              {summary.totalAccounts}
            </div>
          </div>

          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>
              Completas (≥85%)
            </div>
            <div
              data-testid="kpi-complete-accounts"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#059669",
                marginTop: 2,
              }}
            >
              {summary.completeCount}
            </div>
          </div>

          <div
            style={{
              background: "#F1F9FD",
              border: "1px solid #BFE2F4",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--ui-accent-text)", fontWeight: 700 }}>
              En progreso (60–84%)
            </div>
            <div
              data-testid="kpi-in-progress-accounts"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--ui-accent-text-2)",
                marginTop: 2,
              }}
            >
              {summary.inProgressCount}
            </div>
          </div>

          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#B91C1C", fontWeight: 700 }}>
              En riesgo (&lt;60%)
            </div>
            <div
              data-testid="kpi-at-risk-accounts"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#DC2626",
                marginTop: 2,
              }}
            >
              {summary.atRiskCount}
            </div>
          </div>

          <div
            style={{
              background: "var(--ui-accent-soft)",
              border: "1px solid #BFE2F4",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--hb-accent-text)", fontWeight: 700 }}>
              Con pauta activa
            </div>
            <div
              data-testid="kpi-paid-ads-accounts"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--hb-accent-text)",
                marginTop: 2,
              }}
            >
              {summary.withPaidAdsCount}
            </div>
          </div>
        </div>

        {/* Filter Pills + Search Input + Sort Dropdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 4,
            borderTop: "1px solid #F3F4F6",
          }}
        >
          {/* Interactive Status / Paid Ads Filter Pills */}
          <div
            role="tablist"
            aria-label="Filtros de salud de cuentas"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {filterPills.map((pill) => {
              const isActive = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`filter-pill-${pill.id}`}
                  onClick={() => setActiveFilter(pill.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: isActive
                      ? "1.5px solid var(--hb-accent)"
                      : "1px solid #E5E7EB",
                    background: isActive ? "var(--hb-accent)" : "var(--ui-surface)",
                    color: isActive ? "#FFFFFF" : "#374151",
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {pill.dotColor && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isActive ? "var(--ui-surface)" : pill.dotColor,
                      }}
                    />
                  )}
                  <span>{pill.label}</span>
                  <span
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.22)"
                        : "#F3F4F6",
                      color: isActive ? "#FFFFFF" : "#4B5563",
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Sort Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              flex: "1 1 280px",
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
            {/* Search Box */}
            <div
              style={{
                position: "relative",
                flex: "1 1 200px",
                maxWidth: 320,
                minWidth: 160,
              }}
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cuenta, @handle o industria..."
                aria-label="Buscar cuenta"
                data-testid="accounts-search-input"
                style={{
                  width: "100%",
                  padding: "7px 28px 7px 12px",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  fontSize: 12,
                  color: "#111827",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "2px 4px",
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Selector Dropdown */}
            <div ref={sortMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="hbtn"
                onClick={() => setSortDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sortDropdownOpen}
                aria-label="Ordenar cuentas"
                data-testid="accounts-sort-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 11px",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  background: "var(--ui-surface)",
                  color: "#374151",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>Ordenar: {activeSortOption.label}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>▾</span>
              </button>

              {sortMenuPresence.mounted && (
                <div
                  role="listbox"
                  aria-label="Opciones de ordenamiento"
                  className="hubly-dropdown"
                  data-state={sortMenuPresence.state}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    zIndex: 40,
                    background: "var(--ui-surface)",
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    padding: 6,
                    minWidth: 200,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = opt.id === sortBy;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setSortBy(opt.id);
                          setSortDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: active ? "var(--ui-accent-soft)" : "transparent",
                          color: active ? "var(--hb-accent-text)" : "#111827",
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Rule-Based Auto-Suggestions Section (Explicit Rules) ────────── */}
      {showRulesPanel && recommendations.length > 0 && (
        <section
          aria-label="Sugerencias automáticas generadas por reglas"
          data-testid="rule-recommendations-panel"
          style={{
            background: "var(--ui-surface)",
            border: "1px solid #DCEFF9",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 2px 10px rgb(var(--hb-accent-rgb) / 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Sugerencias automáticas por reglas de capacidad y pauta (
                  {recommendations.length})
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#6B7280",
                  }}
                >
                  Calculadas determinísticamente según historial de cumplimiento,
                  tareas vencidas y presupuesto de anuncios
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="hbtn"
                onClick={handleApplyAllRecommendations}
                data-testid="apply-all-recommendations-btn"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Aplicar todas ({recommendations.length})
              </button>
              <button
                type="button"
                className="hbtn"
                onClick={handleOpenAutoSuggestions}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "var(--ui-surface)",
                  color: "#374151",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Configurador por marca
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(275px, 1fr))",
              gap: 10,
            }}
          >
            {recommendations.map((rec) => {
              const prio = getPriorityStyles(rec.priority);
              return (
                <div
                  key={rec.id}
                  data-testid={`recommendation-card-${rec.id}`}
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #EAECEF",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            background: rec.brandBg,
                            color: rec.brandColor,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {rec.brandInitial}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {rec.brandName}
                        </span>
                      </div>

                      <span
                        style={{
                          background: prio.bg,
                          color: prio.color,
                          border: `1px solid ${prio.border}`,
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {prio.label}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {rec.title}
                    </div>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 11,
                        color: "#4B5563",
                        lineHeight: 1.45,
                      }}
                    >
                      {rec.reason}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      paddingTop: 8,
                      borderTop: "1px solid #EAECEF",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--hb-accent-text)",
                      }}
                    >
                      Meta: {rec.currentCommitted} → {rec.recommendedCommitted}{" "}
                      ({rec.deltaPercent > 0 ? "+" : ""}
                      {rec.deltaPercent}%)
                    </span>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="hbtn"
                        onClick={() => handleDismissSingleRecommendation(rec)}
                        data-testid={`dismiss-rec-${rec.id}`}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 7,
                          border: "1px solid #E5E7EB",
                          background: "var(--ui-surface)",
                          color: "#6B7280",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        className="hbtn"
                        onClick={() => handleApplySingleRecommendation(rec)}
                        data-testid={`apply-rec-${rec.id}`}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 7,
                          border: "none",
                          background: "var(--hb-accent)",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty State when Filter / Search has 0 Matches ──────────────── */}
      {accounts.length === 0 ? (
        <section
          data-testid="accounts-empty-state"
          style={{
            background: "var(--ui-surface)",
            border: "1px solid #EAECEF",
            borderRadius: 16,
            padding: "40px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🔍
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            No se encontraron cuentas con los criterios seleccionados
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#6B7280",
              maxWidth: 420,
            }}
          >
            Prueba cambiando el filtro activo ({activeFilter}) o limpiando el
            término de búsqueda &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            className="hbtn"
            onClick={handleClearFilters}
            data-testid="clear-accounts-filters-btn"
            style={{
              marginTop: 6,
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: "var(--hb-accent)",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Limpiar filtros
          </button>
        </section>
      ) : (
        /* ── Accounts Health List / Cards ────────────────────────────────── */
        <section
          aria-label="Listado de salud por cuenta"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {accounts.map((account) => {
            const { brand, deliverables, customMetrics } = account;
            const statusStyle = getStatusStyles(account.healthStatus);
            const isEditing = editingBrandId === brand.id;
            const isCurrentActiveBrand = activeBrandId === brand.id;
            const brandRecommendations = recommendations.filter(
              (r) => r.brandId === brand.id
            );

            return (
              <article
                key={brand.id}
                data-testid={`account-health-card-${brand.id}`}
                style={{
                  background: "var(--ui-surface)",
                  border: isCurrentActiveBrand
                    ? "1.5px solid var(--hb-accent)"
                    : "1px solid #EAECEF",
                  borderRadius: 16,
                  padding: "clamp(14px, 2vw, 20px)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  minWidth: 0,
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
              >
                {/* Top Row: Brand Identity + Status Badge + Edit Action */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {/* Brand Identity */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                      flex: "1 1 240px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveBrand(brand.id)}
                      title={`Seleccionar ${brand.name} como marca activa`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: brand.avatarBg || "#ECFDF5",
                        color: brand.avatarColor || brand.color || "#059669",
                        border: `1.5px solid ${brand.color || "#10B981"}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {brand.initial}
                    </button>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          {brand.name}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            fontWeight: 500,
                          }}
                        >
                          {brand.handle}
                        </span>
                        {brand.industry && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              background: "#F3F4F6",
                              borderRadius: 6,
                              padding: "2px 7px",
                              fontWeight: 600,
                            }}
                          >
                            {brand.industry}
                            {brand.city ? ` · ${brand.city}` : ""}
                          </span>
                        )}
                        {isCurrentActiveBrand && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--hb-accent-text)",
                              background: "var(--ui-accent-soft)",
                              borderRadius: 999,
                              padding: "2px 8px",
                            }}
                          >
                            Marca activa
                          </span>
                        )}
                      </div>

                      {/* Paid Ads Info Line */}
                      <div
                        style={{
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                          fontSize: 12,
                        }}
                      >
                        {account.hasPaidAds ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              color: "var(--ui-accent-text)",
                              background: "#F1F9FD",
                              border: "1px solid #BFE2F4",
                              borderRadius: 7,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            🎯 Pauta activa · gastó $
                            {(
                              brand.monthlySpend ||
                              account.snapshot.adSpend ||
                              0
                            ).toLocaleString("en-US")}{" "}
                            ({activePeriodOption.shortLabel})
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              color: "#6B7280",
                              background: "#F9FAFB",
                              border: "1px solid #E5E7EB",
                              borderRadius: 7,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Orgánico · Sin pauta activa
                          </span>
                        )}

                        <span style={{ fontSize: 11, color: "#6B7280" }}>
                          Tareas: <strong>{account.taskProgress}%</strong> ·{" "}
                          {account.urgentTasksCount > 0 ? (
                            <span style={{ color: "#DC2626", fontWeight: 700 }}>
                              {account.urgentTasksCount} urgentes
                            </span>
                          ) : (
                            <span>0 urgentes</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Health Badge + Edit Commitments Trigger */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div
                      data-testid={`account-health-badge-${brand.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: statusStyle.dot,
                        }}
                      />
                      <span>
                        {statusStyle.label} · {account.healthScore}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="hbtn"
                      onClick={() => handleStartEditCommitments(account)}
                      data-testid={`edit-commitments-btn-${brand.id}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 9,
                        border: isEditing
                          ? "1.5px solid var(--hb-accent)"
                          : "1px solid #E5E7EB",
                        background: isEditing ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                        color: isEditing ? "var(--hb-accent-text)" : "#374151",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isEditing
                        ? "Cerrar edición"
                        : "✏️ Editar compromisos"}
                    </button>
                  </div>
                </div>

                {/* Overall Fulfillment Progress Bar */}
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #F3F4F6",
                    borderRadius: 12,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      Cumplimiento total ({activePeriodOption.label})
                    </span>
                    <span
                      data-testid={`account-fulfillment-text-${brand.id}`}
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: statusStyle.color,
                      }}
                    >
                      {account.totalCompleted} / {account.totalCommitted}{" "}
                      entregables ({account.fulfillmentPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      borderRadius: 999,
                      background: "#E5E7EB",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, account.fulfillmentPercent)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: statusStyle.barColor,
                        transition:
                          "width 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                </div>

                {/* 4 Deliverable Commitment Cards (Publicaciones, Stories, Reels, Campañas Ads) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 10,
                  }}
                >
                  {deliverables.map((deliv) => {
                    const barColor =
                      deliv.percent >= 85
                        ? "#10B981"
                        : deliv.percent >= 60
                        ? "var(--hb-accent)"
                        : "#EF4444";
                    return (
                      <div
                        key={deliv.key}
                        style={{
                          background: "var(--ui-surface)",
                          border: "1px solid #EAECEF",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#4B5563",
                            }}
                          >
                            {deliv.label}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#111827",
                            }}
                          >
                            {deliv.completed}/{deliv.committed}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 5,
                            borderRadius: 999,
                            background: "#F3F4F6",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, deliv.percent)}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: barColor,
                              transition:
                                "width 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#6B7280",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          {deliv.percent}% cumplido
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Metrics & Brand-Specific Rule Suggestions Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#6B7280",
                      }}
                    >
                      Métricas clave:
                    </span>
                    {customMetrics.length > 0 ? (
                      customMetrics.map((metric) => (
                        <span
                          key={metric.id}
                          style={{
                            background: "#F1F9FD",
                            color: "var(--ui-accent-text)",
                            border: "1px solid #BFE2F4",
                            borderRadius: 7,
                            padding: "3px 9px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {metric.name} / {metric.unit}: {metric.value}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                        Sin métricas personalizadas
                      </span>
                    )}
                  </div>

                  {brandRecommendations.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {brandRecommendations.slice(0, 1).map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "var(--ui-accent-soft)",
                            border: "1px solid #BFE2F4",
                            borderRadius: 8,
                            padding: "4px 9px",
                            fontSize: 11,
                            color: "var(--hb-accent-text)",
                            fontWeight: 600,
                          }}
                        >
                          <span>{rec.title}</span>
                          <button
                            type="button"
                            onClick={() => handleApplySingleRecommendation(rec)}
                            style={{
                              background: "var(--hb-accent)",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 5,
                              padding: "2px 7px",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Aplicar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Inline Commitment Editor Panel ──────────────────────── */}
                {isEditing && draftCommitments && (
                  <div
                    data-testid={`commitment-editor-panel-${brand.id}`}
                    style={{
                      marginTop: 4,
                      padding: "16px",
                      borderRadius: 12,
                      background: "#F9FAFB",
                      border: "1.5px solid #BFE2F4",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          Editar compromisos de {brand.name} (
                          {activePeriodOption.label})
                        </h4>
                        <p
                          style={{
                            margin: "2px 0 0 0",
                            fontSize: 11,
                            color: "#6B7280",
                          }}
                        >
                          Ajusta las metas comprometidas y entregadas para
                          recalcular el % de cumplimiento y salud en tiempo real
                        </p>
                      </div>

                      {/* Paid Ads Toggle & Spend Input */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#374151",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={draftCommitments.hasPaidAds}
                            onChange={(e) =>
                              setDraftCommitments({
                                ...draftCommitments,
                                hasPaidAds: e.target.checked,
                              })
                            }
                          />
                          <span>Maneja pauta activa</span>
                        </label>

                        {draftCommitments.hasPaidAds && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#6B7280",
                                fontWeight: 600,
                              }}
                            >
                              Presupuesto ($):
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={draftCommitments.monthlySpend}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  monthlySpend: Number(e.target.value) || 0,
                                })
                              }
                              aria-label="Presupuesto mensual de pauta"
                              style={{
                                width: 90,
                                padding: "4px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deliverable Numeric Inputs Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {/* Publicaciones */}
                      <div
                        style={{
                          background: "var(--ui-surface)",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          Publicaciones
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Entregadas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Publicaciones entregadas ${brand.name}`}
                              data-testid={`input-posts-completed-${brand.id}`}
                              value={draftCommitments.postsCompleted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  postsCompleted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Comprometidas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Publicaciones comprometidas ${brand.name}`}
                              data-testid={`input-posts-committed-${brand.id}`}
                              value={draftCommitments.postsCommitted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  postsCommitted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Stories */}
                      <div
                        style={{
                          background: "var(--ui-surface)",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          Stories
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Entregadas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Stories entregadas ${brand.name}`}
                              data-testid={`input-stories-completed-${brand.id}`}
                              value={draftCommitments.StoriesCompleted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  StoriesCompleted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Comprometidas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Stories comprometidas ${brand.name}`}
                              data-testid={`input-stories-committed-${brand.id}`}
                              value={draftCommitments.StoriesCommitted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  StoriesCommitted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Reels */}
                      <div
                        style={{
                          background: "var(--ui-surface)",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          Reels
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Entregados</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Reels entregados ${brand.name}`}
                              data-testid={`input-reels-completed-${brand.id}`}
                              value={draftCommitments.reelsCompleted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  reelsCompleted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Comprometidos</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Reels comprometidos ${brand.name}`}
                              data-testid={`input-reels-committed-${brand.id}`}
                              value={draftCommitments.reelsCommitted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  reelsCommitted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Campañas Ads */}
                      <div
                        style={{
                          background: "var(--ui-surface)",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          Campañas Ads
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Entregadas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Campañas Ads entregadas ${brand.name}`}
                              data-testid={`input-ads-completed-${brand.id}`}
                              value={draftCommitments.adCampaignsCompleted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  adCampaignsCompleted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                          <label
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            <span>Comprometidas</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Campañas Ads comprometidas ${brand.name}`}
                              data-testid={`input-ads-committed-${brand.id}`}
                              value={draftCommitments.adCampaignsCommitted}
                              onChange={(e) =>
                                setDraftCommitments({
                                  ...draftCommitments,
                                  adCampaignsCommitted: Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  ),
                                })
                              }
                              style={{
                                width: 72,
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: "1px solid #D1D5DB",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Custom Metrics Editor Row */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        paddingTop: 8,
                        borderTop: "1px solid #E5E7EB",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#374151",
                        }}
                      >
                        Métricas personalizadas de rendimiento:
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {draftCommitments.customMetrics.map((m) => (
                          <span
                            key={m.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#F1F9FD",
                              color: "var(--ui-accent-text)",
                              border: "1px solid #BFE2F4",
                              borderRadius: 7,
                              padding: "4px 9px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <span>
                              {m.name} / {m.unit}: {m.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftCustomMetric(m.id)}
                              aria-label={`Eliminar métrica ${m.name}`}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "var(--ui-accent-text)",
                                cursor: "pointer",
                                fontWeight: 800,
                                padding: 0,
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <select
                          aria-label="Plantilla de métrica"
                          value=""
                          onChange={(e) => {
                            const template = METRIC_TEMPLATES.flatMap((g) => g.items).find(
                              (t) => t.name === e.target.value
                            );
                            if (!template) return;
                            setNewMetricName(template.name);
                            setNewMetricUnit(template.unit);
                          }}
                          style={{
                            padding: "5px 9px",
                            borderRadius: 7,
                            border: "1px solid #D1D5DB",
                            fontSize: 12,
                            background: "var(--ui-surface)",
                          }}
                        >
                          <option value="">Usar plantilla…</option>
                          {METRIC_TEMPLATES.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.items.map((t) => (
                                <option key={t.name} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newMetricName}
                          onChange={(e) => setNewMetricName(e.target.value)}
                          placeholder="Ej: Leads calificados"
                          aria-label="Nombre de métrica personalizada"
                          style={{
                            padding: "5px 9px",
                            borderRadius: 7,
                            border: "1px solid #D1D5DB",
                            fontSize: 11,
                            minWidth: 150,
                          }}
                        />
                        <input
                          type="number"
                          value={newMetricValue}
                          onChange={(e) => setNewMetricValue(e.target.value)}
                          placeholder="Meta (ej. 25)"
                          aria-label="Valor de métrica personalizada"
                          style={{
                            width: 90,
                            padding: "5px 9px",
                            borderRadius: 7,
                            border: "1px solid #D1D5DB",
                            fontSize: 11,
                          }}
                        />
                        <select
                          value={newMetricUnit}
                          onChange={(e) =>
                            setNewMetricUnit(
                              e.target.value as "semana" | "mes" | "total"
                            )
                          }
                          aria-label="Unidad de métrica personalizada"
                          style={{
                            padding: "5px 8px",
                            borderRadius: 7,
                            border: "1px solid #D1D5DB",
                            fontSize: 11,
                            background: "var(--ui-surface)",
                          }}
                        >
                          <option value="semana">por semana</option>
                          <option value="mes">por mes</option>
                          <option value="total">total</option>
                        </select>
                        <button
                          type="button"
                          className="hbtn"
                          onClick={handleAddDraftCustomMetric}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 7,
                            border: "1px solid #D1D5DB",
                            background: "var(--ui-surface)",
                            color: "#374151",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          + Agregar métrica
                        </button>
                      </div>
                    </div>

                    {/* Save / Cancel Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                        paddingTop: 6,
                      }}
                    >
                      <button
                        type="button"
                        className="hbtn"
                        onClick={() => {
                          setEditingBrandId(null);
                          setDraftCommitments(null);
                        }}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          background: "var(--ui-surface)",
                          color: "#4B5563",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="hbtn"
                        onClick={() =>
                          handleSaveCommitments(brand.id, brand.name)
                        }
                        data-testid={`save-commitments-btn-${brand.id}`}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
                          border: "none",
                          background: "var(--hb-accent)",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgb(var(--hb-accent-rgb) / 0.25)",
                        }}
                      >
                        Guardar compromisos
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default SaludCuentasView;
