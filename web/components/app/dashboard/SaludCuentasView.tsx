"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useHublyStore } from "@/lib/store";
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
  HublyPinIcon,
  HublyPlusIcon,
  HublyCheckIcon,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";

// ─── Periodos ──────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { id: CommitmentPeriod; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "semana", label: "Esta semana" },
  { id: "mes_actual", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "trimestre", label: "Trimestre" },
];

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

type SortOptionId =
  | "health_desc"
  | "health_asc"
  | "name_asc"
  | "budget_desc"
  | "fulfillment_desc";

const SORT_OPTIONS: { id: SortOptionId; label: string }[] = [
  { id: "health_desc", label: "Salud: mayor a menor" },
  { id: "health_asc", label: "Salud: menor a mayor" },
  { id: "fulfillment_desc", label: "% de cumplimiento" },
  { id: "budget_desc", label: "Mayor inversión en pauta" },
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

type DraftNumberKey = Exclude<keyof CommitmentDraft, "hasPaidAds" | "customMetrics">;

const EDITOR_FIELDS: {
  id: string;
  label: string;
  done: DraftNumberKey;
  commit: DraftNumberKey;
}[] = [
  { id: "posts", label: "Publicaciones", done: "postsCompleted", commit: "postsCommitted" },
  { id: "stories", label: "Stories", done: "StoriesCompleted", commit: "StoriesCommitted" },
  { id: "reels", label: "Reels", done: "reelsCompleted", commit: "reelsCommitted" },
  { id: "ads", label: "Campañas Ads", done: "adCampaignsCompleted", commit: "adCampaignsCommitted" },
];

const STATUS_LABEL: Record<BrandHealthStatus, string> = {
  completa: "Completa",
  en_progreso: "En progreso",
  en_riesgo: "En riesgo",
  sin_compromisos: "Sin compromisos",
};

const PRIORITY_LABEL: Record<string, string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baja: "Oportunidad",
};

const money = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

const MAX_VISIBLE_RECOMMENDATIONS = 4;

export function SaludCuentasView() {
  // ── Store ───────────────────────────────────────────────────────────────
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const testClock = useHublyStore((s) => s.testClock);
  const autoSuggestionsModalOpen = useHublyStore((s) => s.autoSuggestionsModalOpen);
  const dismissedRecommendationIds = useHublyStore((s) => s.dismissedRecommendationIds);
  const appliedRecommendationsMap = useHublyStore((s) => s.appliedRecommendationsMap);

  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setAutoSuggestionsModalOpen = useHublyStore((s) => s.setAutoSuggestionsModalOpen);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updateBrandCommitments = useHublyStore((s) => s.updateBrandCommitments);
  const setBrandCustomMetrics = useHublyStore((s) => s.setBrandCustomMetrics);
  const applyRecommendation = useHublyStore((s) => s.applyRecommendation);
  const applyRecommendationsBatch = useHublyStore((s) => s.applyRecommendationsBatch);
  const dismissRecommendation = useHublyStore((s) => s.dismissRecommendation);

  // ── Estado local ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<CommitmentPeriod>("mes_actual");
  const [activeFilter, setActiveFilter] = useState<AccountsHealthFilter>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOptionId>("health_desc");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [draftCommitments, setDraftCommitments] = useState<CommitmentDraft | null>(null);
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState<"semana" | "mes" | "total">("semana");
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // El modal de sugerencias solo se abre si la URL lo pide: ?modal=sugerencias
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "sugerencias") {
      setAutoSuggestionsModalOpen(true);
    } else if (autoSuggestionsModalOpen) {
      setAutoSuggestionsModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = setTimeout(() => setFeedbackBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [feedbackBanner]);

  // ── Datos derivados ─────────────────────────────────────────────────────
  const healthData = useMemo(() => {
    const result = selectAccountsHealth(brands, tasks, posts, {
      period,
      filter: activeFilter,
      searchQuery,
      sortBy,
      referenceNow: testClock,
    });
    const base = sortBy === "name_asc"
      ? [...result.accounts].sort((a, b) => a.brand.name.localeCompare(b.brand.name, "es"))
      : [...result.accounts];
    return {
      ...result,
      accounts: base.sort((a, b) => Number(Boolean(b.brand.pinned)) - Number(Boolean(a.brand.pinned))),
    };
  }, [brands, tasks, posts, period, activeFilter, searchQuery, sortBy, testClock]);

  const recommendations = useMemo(
    () => selectAccountRecommendations(brands, tasks, posts, dismissedRecommendationIds, appliedRecommendationsMap),
    [brands, tasks, posts, dismissedRecommendationIds, appliedRecommendationsMap]
  );

  const { accounts, summary } = healthData;
  const periodLabel = (PERIOD_OPTIONS.find((p) => p.id === period) ?? PERIOD_OPTIONS[3]).label;
  const targetPeriodKey: "mes_actual" | "mes_anterior" | "trimestre" =
    period === "mes_anterior" ? "mes_anterior" : period === "trimestre" ? "trimestre" : "mes_actual";
  const hasActiveFilters = activeFilter !== "todas" || searchQuery.trim() !== "";
  const visibleRecommendations = showAllRecommendations
    ? recommendations
    : recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS);

  // ── Acciones ────────────────────────────────────────────────────────────
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
      StoriesCommitted: snapshot.StoriesCommitted ?? snapshot.storiesCommitted ?? 16,
      StoriesCompleted: snapshot.StoriesCompleted ?? snapshot.storiesCompleted ?? 14,
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

  function handleCancelEdit() {
    setEditingBrandId(null);
    setDraftCommitments(null);
  }

  function setDraftNumber(key: DraftNumberKey, raw: string) {
    setDraftCommitments((d) => (d ? { ...d, [key]: Math.max(0, Number(raw) || 0) } : d));
  }

  function handleSaveCommitments(brandId: string, brandName: string) {
    if (!draftCommitments) return;
    // Al editar con la ventana de 7 días, las cifras semanales se escalan x4 al guardarlas como mes.
    const k = period === "7d" ? 4 : 1;
    const scaled = (n: number, factor = k) => Math.max(0, Math.round(n * factor));
    const StoriesCommitted = scaled(draftCommitments.StoriesCommitted);
    const StoriesCompleted = scaled(draftCommitments.StoriesCompleted);
    const spend = draftCommitments.hasPaidAds ? Math.max(0, Number(draftCommitments.monthlySpend) || 0) : 0;

    updateBrand(brandId, {
      hasPaidAds: draftCommitments.hasPaidAds,
      monthlySpend: Math.max(0, Number(draftCommitments.monthlySpend) || 0),
    });
    updateBrandCommitments(
      brandId,
      {
        hasDeclaredCommitments: true,
        postsCommitted: scaled(draftCommitments.postsCommitted),
        postsCompleted: scaled(draftCommitments.postsCompleted),
        StoriesCommitted,
        StoriesCompleted,
        storiesCommitted: StoriesCommitted,
        storiesCompleted: StoriesCompleted,
        reelsCommitted: scaled(draftCommitments.reelsCommitted),
        reelsCompleted: scaled(draftCommitments.reelsCompleted),
        adCampaignsCommitted: scaled(draftCommitments.adCampaignsCommitted, 1),
        adCampaignsCompleted: scaled(draftCommitments.adCampaignsCompleted, 1),
        adSpend: spend,
        customMetrics: draftCommitments.customMetrics,
      },
      targetPeriodKey
    );
    setBrandCustomMetrics(brandId, draftCommitments.customMetrics);
    setEditingBrandId(null);
    setDraftCommitments(null);
    setFeedbackBanner(`Compromisos de ${brandName} guardados (${periodLabel}).`);
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
    setDraftCommitments({ ...draftCommitments, customMetrics: [...draftCommitments.customMetrics, metric] });
    setNewMetricName("");
    setNewMetricValue("");
  }

  function handleRemoveDraftCustomMetric(metricId: string) {
    if (!draftCommitments) return;
    setDraftCommitments({
      ...draftCommitments,
      customMetrics: draftCommitments.customMetrics.filter((m) => m.id !== metricId),
    });
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

  const filterPills: { id: AccountsHealthFilter; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: summary.totalAccounts },
    { id: "con_pauta", label: "Con pauta", count: summary.withPaidAdsCount },
    { id: "sin_pauta", label: "Sin pauta", count: summary.withoutPaidAdsCount },
    { id: "en_riesgo", label: "En riesgo", count: summary.atRiskCount },
    { id: "completas", label: "Completas", count: summary.completeCount },
  ];

  const subtitle =
    summary.totalAccounts === 0
      ? "Cumplimiento de cada marca frente a lo que comprometiste."
      : hasActiveFilters
        ? `${accounts.length} de ${summary.totalAccounts} ${summary.totalAccounts === 1 ? "cuenta" : "cuentas"} · ${periodLabel}`
        : `${summary.totalAccounts} ${summary.totalAccounts === 1 ? "cuenta" : "cuentas"} · ${periodLabel}`;

  return (
    <div className="hubly-salud hubly-touch" data-testid="salud-cuentas-view">
      <header className="hubly-salud-head">
        <div>
          <h1 className="hubly-cal-title">Salud de cuentas</h1>
          <p className="hubly-cal-subtitle">
            {subtitle}
            {summary.totalAccounts > 0 && (
              <>
                {" · Salud promedio "}
                <strong data-testid="average-health-score">{summary.averageHealthScore}%</strong>
              </>
            )}
          </p>
        </div>
        <button type="button" className="hbtn hbtn-secondary" onClick={() => setNewBrandModalOpen(true)}>
          <HublyPlusIcon size={17} /> Nueva marca
        </button>
      </header>

      {summary.uncommittedBrandsCount > 0 && (
        <div className="hubly-salud-notice">
          <HublySparkIcon size={18} />
          <p>
            <strong>
              {summary.uncommittedBrandsCount}{" "}
              {summary.uncommittedBrandsCount === 1 ? "marca sin compromisos" : "marcas sin compromisos"}
            </strong>
            Declara cuánto vas a entregar y Hubly calculará el cumplimiento y la salud de cada una.
          </p>
          <button
            type="button"
            className="hbtn hbtn-secondary hbtn-sm"
            data-testid="open-suggestions-modal-btn"
            onClick={() => setAutoSuggestionsModalOpen(true)}
          >
            Declarar compromisos
          </button>
        </div>
      )}

      <div className="hubly-salud-toolbar">
        <div className="hubly-cal-tabs is-text" role="tablist" aria-label="Periodo">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={period === opt.id}
              className="hubly-cal-tab"
              data-testid={`period-btn-${opt.id}`}
              onClick={() => setPeriod(opt.id)}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <span className="hubly-salud-spacer" />
        <input
          type="search"
          className="hubly-cal-input hubly-salud-search"
          placeholder="Buscar cuenta, @usuario o giro"
          aria-label="Buscar cuenta"
          data-testid="accounts-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="hubly-cal-input hubly-salud-sort"
          aria-label="Ordenar cuentas"
          data-testid="accounts-sort-btn"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOptionId)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hubly-cal-pills hubly-salud-filters" role="group" aria-label="Filtrar cuentas">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className="hubly-cal-pill"
            aria-pressed={activeFilter === pill.id}
            data-testid={`filter-pill-${pill.id}`}
            onClick={() => setActiveFilter(pill.id)}
          >
            {pill.label} <span className="hubly-salud-count">{pill.count}</span>
          </button>
        ))}
      </div>

      {recommendations.length > 0 && (
        <section className="hubly-salud-section" aria-label="Sugerencias" data-testid="rule-recommendations-panel">
          <div className="hubly-salud-section-head">
            <div>
              <h2>Sugerencias ({recommendations.length})</h2>
              <p>Calculadas con tu historial de cumplimiento, tareas vencidas y presupuesto de pauta.</p>
            </div>
            <div className="hubly-salud-actions">
              {showRecommendations && (
                <button
                  type="button"
                  className="hbtn hbtn-secondary hbtn-sm"
                  data-testid="apply-all-recommendations-btn"
                  onClick={handleApplyAllRecommendations}
                >
                  Aplicar todas ({recommendations.length})
                </button>
              )}
              <button type="button" className="hbtn hbtn-ghost hbtn-sm" onClick={() => setAutoSuggestionsModalOpen(true)}>
                Configurar por marca
              </button>
              <button
                type="button"
                className="hbtn hbtn-ghost hbtn-sm"
                aria-expanded={showRecommendations}
                onClick={() => setShowRecommendations((v) => !v)}
              >
                {showRecommendations ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          {showRecommendations && (
            <div className="hubly-salud-list">
              {visibleRecommendations.map((rec) => (
                <div key={rec.id} className="hubly-salud-rec" data-testid={`recommendation-card-${rec.id}`}>
                  <span className="hubly-ajustes-dot" aria-hidden>
                    {rec.brandInitial}
                  </span>
                  <div className="hubly-salud-rec-text">
                    <div className="hubly-cal-row-title">
                      {rec.title}
                      <span className="hubly-salud-rec-brand"> · {rec.brandName}</span>
                    </div>
                    <div className="hubly-cal-row-meta">
                      <span title={rec.reason} className="hubly-salud-clamp">
                        {rec.reason}
                      </span>
                    </div>
                    <div className="hubly-cal-row-meta">
                      <span>Meta {rec.currentCommitted} → {rec.recommendedCommitted}</span>
                      <span>· {PRIORITY_LABEL[(rec.priority || "media").toLowerCase()]}</span>
                    </div>
                  </div>
                  <div className="hubly-salud-actions">
                    <button
                      type="button"
                      className="hbtn hbtn-ghost hbtn-sm"
                      data-testid={`dismiss-rec-${rec.id}`}
                      onClick={() => handleDismissSingleRecommendation(rec)}
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      className="hbtn hbtn-secondary hbtn-sm"
                      data-testid={`apply-rec-${rec.id}`}
                      onClick={() => handleApplySingleRecommendation(rec)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              ))}
              {recommendations.length > MAX_VISIBLE_RECOMMENDATIONS && (
                <button
                  type="button"
                  className="hubly-salud-more"
                  onClick={() => setShowAllRecommendations((v) => !v)}
                >
                  {showAllRecommendations
                    ? "Ver menos"
                    : `Ver ${recommendations.length - MAX_VISIBLE_RECOMMENDATIONS} más`}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {accounts.length === 0 ? (
        <div className="hubly-cal-empty" data-testid="accounts-empty-state">
          {summary.totalAccounts === 0 ? (
            <>
              <strong>Sin cuentas</strong>
              <span>Crea una marca para medir su cumplimiento.</span>
              <button type="button" className="hbtn hbtn-secondary" onClick={() => setNewBrandModalOpen(true)}>
                <HublyPlusIcon size={17} /> Nueva marca
              </button>
            </>
          ) : (
            <>
              <strong>Sin resultados con estos filtros</strong>
              <span>
                {hasActiveFilters
                  ? "Ninguna cuenta coincide con lo que buscas."
                  : "No hay cuentas en este periodo."}
              </span>
              <button
                type="button"
                className="hbtn hbtn-secondary hbtn-sm"
                data-testid="clear-accounts-filters-btn"
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            </>
          )}
        </div>
      ) : (
        <section className="hubly-salud-list" aria-label="Salud por cuenta">
          {accounts.map((account) => {
            const { brand, deliverables, customMetrics } = account;
            const isEditing = editingBrandId === brand.id;
            const isActive = activeBrandId === brand.id;
            const tone = account.healthStatus === "en_riesgo" ? "risk" : account.healthStatus === "completa" ? "ok" : "mid";
            const spend = brand.monthlySpend || account.snapshot.adSpend || 0;

            return (
              <article key={brand.id} className="hubly-salud-item" data-testid={`account-health-card-${brand.id}`}>
                <div className="hubly-salud-item-head">
                  <span
                    className="hubly-ajustes-dot"
                    style={{ background: brand.avatarBg, color: brand.avatarColor || brand.color }}
                    aria-hidden
                  >
                    {brand.initial}
                  </span>
                  <div className="hubly-salud-item-text">
                    <div className="hubly-cal-row-title">
                      {brand.name}
                      <span className="hubly-salud-handle"> {brand.handle}</span>
                    </div>
                    <div className="hubly-cal-row-meta">
                      {brand.industry && (
                        <span className="hubly-salud-clamp">
                          {brand.industry}
                          {brand.city ? ` · ${brand.city}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="hubly-cal-row-meta">
                      <span>{account.hasPaidAds ? `Pauta activa · gastó ${money(spend)}` : "Sin pauta"}</span>
                      <span>
                        · Tareas {account.taskProgress}%
                        {account.urgentTasksCount > 0
                          ? ` · ${account.urgentTasksCount} ${account.urgentTasksCount === 1 ? "urgente" : "urgentes"}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="hubly-salud-actions">
                    <button
                      type="button"
                      className="hbtn hbtn-ghost hbtn-sm"
                      aria-label={`${brand.pinned ? "Soltar" : "Fijar"} ${brand.name}`}
                      aria-pressed={Boolean(brand.pinned)}
                      title={brand.pinned ? "Soltar cuenta" : "Fijar cuenta arriba"}
                      onClick={() => updateBrand(brand.id, { pinned: !brand.pinned })}
                    >
                      <HublyPinIcon size={15} />
                    </button>
                    <span className="hubly-salud-status" data-tone={tone} data-testid={`account-health-badge-${brand.id}`}>
                      {STATUS_LABEL[account.healthStatus] ?? "En progreso"} · {account.healthScore}%
                    </span>
                    {isActive ? (
                      <span className="hubly-salud-current">Marca activa</span>
                    ) : (
                      <button
                        type="button"
                        className="hbtn hbtn-ghost hbtn-sm"
                        title={`Trabajar con ${brand.name}`}
                        onClick={() => setActiveBrand(brand.id)}
                      >
                        Activar
                      </button>
                    )}
                    <button
                      type="button"
                      className="hbtn hbtn-secondary hbtn-sm"
                      aria-expanded={isEditing}
                      data-testid={`edit-commitments-btn-${brand.id}`}
                      onClick={() => handleStartEditCommitments(account)}
                    >
                      {isEditing ? "Cerrar edición" : "Editar compromisos"}
                    </button>
                  </div>
                </div>

                <div className="hubly-salud-total">
                  <span>Cumplimiento total · {periodLabel}</span>
                  <span data-testid={`account-fulfillment-text-${brand.id}`}>
                    {account.totalCompleted} / {account.totalCommitted} entregables ({account.fulfillmentPercent}%)
                  </span>
                </div>
                <div className="hubly-salud-meter" data-tone={tone} role="img" aria-label={`Cumplimiento ${account.fulfillmentPercent}%`}>
                  <i style={{ width: `${Math.min(100, account.fulfillmentPercent)}%` }} />
                </div>

                <div className="hubly-salud-deliverables">
                  {deliverables.map((d) => (
                    <div key={d.key} className="hubly-salud-deliverable">
                      <div>
                        <span>{d.label}</span>
                        <strong>
                          {d.completed}/{d.committed}
                        </strong>
                      </div>
                      <div className="hubly-salud-meter is-thin" data-tone={d.percent < 60 ? "risk" : "mid"}>
                        <i style={{ width: `${Math.min(100, d.percent)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="hubly-salud-metrics">
                  <span>Métricas clave</span>
                  {customMetrics.length > 0
                    ? customMetrics.map((m) => `${m.name} (${m.unit}): ${m.value}`).join(" · ")
                    : "Sin métricas personalizadas"}
                </p>

                {isEditing && draftCommitments && (
                  <div className="hubly-salud-editor" data-testid={`commitment-editor-panel-${brand.id}`}>
                    <div className="hubly-salud-section-head">
                      <div>
                        <h2>Compromisos de {brand.name}</h2>
                        <p>
                          Periodo: {periodLabel}. Al cambiar las cifras se recalculan el cumplimiento y la salud.
                        </p>
                      </div>
                    </div>

                    <div className="hubly-salud-editor-grid">
                      {EDITOR_FIELDS.map((f) => (
                        <fieldset key={f.id} className="hubly-salud-fieldset">
                          <legend>{f.label}</legend>
                          <label>
                            <span>Entregadas</span>
                            <input
                              type="number"
                              min={0}
                              className="hubly-cal-input"
                              aria-label={`${f.label} entregadas ${brand.name}`}
                              data-testid={`input-${f.id}-completed-${brand.id}`}
                              value={draftCommitments[f.done] as number}
                              onChange={(e) => setDraftNumber(f.done, e.target.value)}
                            />
                          </label>
                          <label>
                            <span>Comprometidas</span>
                            <input
                              type="number"
                              min={0}
                              className="hubly-cal-input"
                              aria-label={`${f.label} comprometidas ${brand.name}`}
                              data-testid={`input-${f.id}-committed-${brand.id}`}
                              value={draftCommitments[f.commit] as number}
                              onChange={(e) => setDraftNumber(f.commit, e.target.value)}
                            />
                          </label>
                        </fieldset>
                      ))}
                    </div>

                    <div className="hubly-salud-paid">
                      <label className="hubly-salud-check">
                        <input
                          type="checkbox"
                          checked={draftCommitments.hasPaidAds}
                          onChange={(e) => setDraftCommitments({ ...draftCommitments, hasPaidAds: e.target.checked })}
                        />
                        <span>Maneja pauta</span>
                      </label>
                      {draftCommitments.hasPaidAds && (
                        <label className="hubly-salud-inline">
                          <span>Presupuesto mensual ($)</span>
                          <input
                            type="number"
                            min={0}
                            className="hubly-cal-input"
                            aria-label="Presupuesto mensual de pauta"
                            value={draftCommitments.monthlySpend}
                            onChange={(e) =>
                              setDraftCommitments({ ...draftCommitments, monthlySpend: Number(e.target.value) || 0 })
                            }
                          />
                        </label>
                      )}
                    </div>

                    <div className="hubly-salud-section">
                      <h3 className="hubly-ajustes-label">Métricas personalizadas</h3>
                      {draftCommitments.customMetrics.length > 0 && (
                        <ul className="hubly-salud-metric-list">
                          {draftCommitments.customMetrics.map((m) => (
                            <li key={m.id}>
                              <span>
                                {m.name} · {m.unit}: {m.value}
                              </span>
                              <button
                                type="button"
                                className="hbtn hbtn-ghost hbtn-xs"
                                aria-label={`Eliminar métrica ${m.name}`}
                                onClick={() => handleRemoveDraftCustomMetric(m.id)}
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="hubly-salud-add">
                        <select
                          className="hubly-cal-input"
                          aria-label="Plantilla de métrica"
                          value=""
                          onChange={(e) => {
                            const template = METRIC_TEMPLATES.flatMap((g) => g.items).find((t) => t.name === e.target.value);
                            if (!template) return;
                            setNewMetricName(template.name);
                            setNewMetricUnit(template.unit);
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
                          className="hubly-cal-input"
                          value={newMetricName}
                          onChange={(e) => setNewMetricName(e.target.value)}
                          placeholder="Ej. Leads calificados"
                          aria-label="Nombre de métrica personalizada"
                        />
                        <input
                          type="number"
                          min={0}
                          className="hubly-cal-input"
                          value={newMetricValue}
                          onChange={(e) => setNewMetricValue(e.target.value)}
                          placeholder="Meta"
                          aria-label="Valor de métrica personalizada"
                        />
                        <select
                          className="hubly-cal-input"
                          aria-label="Unidad de métrica personalizada"
                          value={newMetricUnit}
                          onChange={(e) => setNewMetricUnit(e.target.value as "semana" | "mes" | "total")}
                        >
                          <option value="semana">por semana</option>
                          <option value="mes">por mes</option>
                          <option value="total">total</option>
                        </select>
                        <button
                          type="button"
                          className="hbtn hbtn-secondary hbtn-sm"
                          disabled={!newMetricName.trim()}
                          onClick={handleAddDraftCustomMetric}
                        >
                          <HublyCheckIcon size={15} /> Agregar
                        </button>
                      </div>
                    </div>

                    <div className="hubly-salud-actions is-end">
                      <button type="button" className="hbtn hbtn-ghost" onClick={handleCancelEdit}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="hbtn hbtn-primary"
                        data-testid={`save-commitments-btn-${brand.id}`}
                        onClick={() => handleSaveCommitments(brand.id, brand.name)}
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

      {feedbackBanner && (
        <div className="hubly-undo-toast" role="status" aria-live="polite">
          {feedbackBanner}
        </div>
      )}
    </div>
  );
}

export default SaludCuentasView;
