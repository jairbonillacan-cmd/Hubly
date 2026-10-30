"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  FileText,
  Globe,
  MessageCircle,
  Minus,
  MousePointerClick,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import { selectAccountRecommendations } from "@/lib/domain-selectors";
import type {
  AccountCommitment,
  AccountRecommendation,
  RecommendationMetricKey,
} from "@/lib/types";

export interface SuggestedMetricItem {
  id: string;
  checked: boolean;
  icon: "globe" | "mouse" | "form" | "chat" | "ig" | "fb";
  title: string;
  subtitle: string;
  target: string;
}

export interface BrandConfigMetric {
  id: string;
  name: string;
  target: string | number;
  unit: "por semana" | "por mes" | "por campaña" | string;
  checked?: boolean;
}

export interface BrandConfig {
  id: string;
  name: string;
  runsPaidAds: boolean;
  monthlySpend: string | number;
  commitments: {
    Publicaciones: number;
    Stories: number;
    Reels: number;
    "Campañas Ads": number;
  };
  metrics: BrandConfigMetric[];
}

export interface AutoSuggestionsModalProps {
  open?: boolean;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApply?: (payload: any[]) => void;
  isFallbackMount?: boolean;
}

const DEFAULT_METRICS: SuggestedMetricItem[] = [
  {
    id: "m-lpv",
    checked: true,
    icon: "globe",
    title: "Landing page views / semana",
    subtitle: "Hoy llegan ~5.5 visitas a la página por semana",
    target: "5.5",
  },
  {
    id: "m-clicks",
    checked: true,
    icon: "mouse",
    title: "Clicks / semana",
    subtitle: "Hoy consigue ~330 clics por semana",
    target: "330",
  },
  {
    id: "m-leads",
    checked: false,
    icon: "form",
    title: "Leads (formularios) / semana",
    subtitle: "Cuando pides datos en un formulario dentro del anuncio",
    target: "12",
  },
  {
    id: "m-conv",
    checked: false,
    icon: "chat",
    title: "Conversaciones / semana",
    subtitle: "Mensajes iniciados por WhatsApp, Messenger o Instagram",
    target: "25",
  },
  {
    id: "m-ig",
    checked: false,
    icon: "ig",
    title: "Alcance en Instagram / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "5,000",
  },
  {
    id: "m-fb",
    checked: false,
    icon: "fb",
    title: "Alcance en Facebook / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "3,500",
  },
];

const METRIC_KEY_LABELS: Record<RecommendationMetricKey, string> = {
  posts: "Publicaciones mensuales",
  reels: "Reels mensuales",
  stories: "Stories mensuales",
  ads: "Campañas Ads",
};

function mapMetricKeyToCommitmentPatch(
  metricKey: RecommendationMetricKey,
  value: number
): Partial<AccountCommitment> {
  if (metricKey === "posts") return { postsCommitted: value };
  if (metricKey === "reels") return { reelsCommitted: value };
  if (metricKey === "stories")
    return { StoriesCommitted: value, storiesCommitted: value };
  return { adCampaignsCommitted: value };
}

let primaryAutoSuggestionsMounts = 0;

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

function MetricCardIcon({ type }: { type: SuggestedMetricItem["icon"] }) {
  if (type === "globe") {
    return <Globe size={15} style={{ color: "#38BDF8" }} />;
  }
  if (type === "mouse") {
    return <MousePointerClick size={15} style={{ color: "#94A3B8" }} />;
  }
  if (type === "form") {
    return <FileText size={15} style={{ color: "#CB997E" }} />;
  }
  if (type === "chat") {
    return <MessageCircle size={15} style={{ color: "#CBD5E1" }} />;
  }
  if (type === "ig") {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="3.5"
          stroke="#EC4899"
          strokeWidth="1.5"
        />
        <circle cx="8" cy="8" r="2.6" stroke="#EC4899" strokeWidth="1.4" />
        <circle cx="11.4" cy="4.6" r="0.8" fill="#EC4899" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="#3B82F6" />
      <path
        d="M9.6 5.5H8.7C8.2 5.5 8 5.75 8 6.2V7.2H9.5L9.3 8.6H8V12.5H6.5V8.6H5.4V7.2H6.5V6C6.5 4.8 7.2 4.1 8.5 4.1C9.1 4.1 9.6 4.2 9.6 4.2V5.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function AutoSuggestionsModal({
  open: openProp,
  onClose: onCloseProp,
  onApply,
  isFallbackMount = false,
}: AutoSuggestionsModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const [suppressedAsFallback, setSuppressedAsFallback] = useState(false);

  useEffect(() => {
    if (!isFallbackMount) {
      primaryAutoSuggestionsMounts += 1;
      return () => {
        primaryAutoSuggestionsMounts = Math.max(
          0,
          primaryAutoSuggestionsMounts - 1
        );
      };
    } else {
      setSuppressedAsFallback(primaryAutoSuggestionsMounts > 0);
    }
  }, [isFallbackMount]);

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
      setExplicitlyUnlocked(true);
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
      setExplicitlyUnlocked(true);
    } else if (prevOpenPropRef.current === false && openProp === true) {
      setExplicitlyUnlocked(true);
    }
    prevOpenPropRef.current = openProp;
  }, [openProp, autoSuggestionsModalOpen]);

  const rawOpen =
    openProp !== undefined
      ? openProp || autoSuggestionsModalOpen
      : autoSuggestionsModalOpen;
  const isOpen = !suppressedAsFallback && explicitlyUnlocked && rawOpen;

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === "Tab") {
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const presence = useModalPresence(isOpen);
  if (!presence.mounted) return null;

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

  return (
    <div
      className="hubly-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          background: "#FFFFFF",
          borderRadius: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#0F172A",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#F0F1F9",
                color: "#6C77C1",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: 16.5,
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.25,
                }}
              >
                Sugerencias automáticas de compromisos
              </h2>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#64748B",
                  lineHeight: 1.4,
                }}
              >
                Recomendaciones calculadas con reglas determinísticas sobre el
                cumplimiento real del último mes en tus {brands.length} marcas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar sugerencias automáticas"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div
          style={{
            padding: "10px 22px",
            background: "#F8FAFC",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "#E2E8F0",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            <button
              ref={firstActionRef}
              type="button"
              onClick={() => setActiveView("reglas")}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                background:
                  activeView === "reglas" ? "#FFFFFF" : "transparent",
                color: activeView === "reglas" ? "#6C77C1" : "#475569",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  activeView === "reglas"
                    ? "0 1px 2px rgba(15,23,42,0.08)"
                    : "none",
              }}
            >
              Recomendaciones por marca ({pendingRecommendations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("metricas")}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                background:
                  activeView === "metricas" ? "#FFFFFF" : "transparent",
                color: activeView === "metricas" ? "#6C77C1" : "#475569",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  activeView === "metricas"
                    ? "0 1px 2px rgba(15,23,42,0.08)"
                    : "none",
              }}
            >
              Métricas semanales de pauta
            </button>
          </div>

          <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            Motor de reglas local · Auditable
          </span>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: "16px 22px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
          }}
        >
          {feedbackBanner && (
            <div
              role="status"
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                color: "#166534",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {feedbackBanner}
            </div>
          )}

          {activeView === "reglas" ? (
            pendingRecommendations.length > 0 ? (
              pendingRecommendations.map((rec) => {
                const effectiveVal = getEffectiveValue(rec);
                const diffAbs = effectiveVal - rec.currentCommitted;
                const diffPct =
                  rec.currentCommitted > 0
                    ? Math.round((diffAbs / rec.currentCommitted) * 100)
                    : 100;

                return (
                  <div
                    key={rec.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      boxShadow: "0 2px 6px rgba(15,23,42,0.03)",
                    }}
                  >
                    {/* Top Row: Brand Avatar + Name + Metric + Delta Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: rec.brandColor,
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {rec.brandInitial}
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#0F172A",
                              }}
                            >
                              {rec.brandName}
                            </span>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 9999,
                                background: "#F1F5F9",
                                color: "#334155",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {getMetricTitle(rec)}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "#64748B",
                              marginTop: 2,
                            }}
                          >
                            Compromiso actual:{" "}
                            <strong style={{ color: "#0F172A" }}>
                              {rec.currentCommitted}/mes
                            </strong>{" "}
                            · Completado mes pasado:{" "}
                            <strong style={{ color: "#0F172A" }}>
                              {rec.completedLastPeriod}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Delta Badge +X (+Y%) */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 9999,
                          background: diffAbs >= 0 ? "#DCFCE7" : "#ECEEF8",
                          color: diffAbs >= 0 ? "#15803D" : "#5360A5",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <TrendingUp size={13} />
                        <span>
                          {diffAbs >= 0 ? `+${diffAbs}` : diffAbs} (
                          {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`})
                        </span>
                      </span>
                    </div>

                    {/* Explicit Rule Reason & Data Source */}
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        fontSize: 12,
                        color: "#334155",
                        lineHeight: 1.45,
                      }}
                    >
                      <div>{rec.reason}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748B",
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        Fuente: {rec.dataSourceLabel}
                      </div>
                    </div>

                    {/* Bottom Controls: Manual +/- Stepper + Individual Aplicar / Descartar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Nuevo compromiso sugerido:
                        </span>

                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "#F8FAFC",
                            border: "1px solid #CBD5E1",
                            borderRadius: 9,
                            padding: "2px 6px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleAdjustValue(rec, -1)}
                            aria-label={`Disminuir meta sugerida para ${rec.brandName}`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: "none",
                              background: "#FFFFFF",
                              color: "#334155",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            style={{
                              minWidth: 28,
                              textAlign: "center",
                              fontSize: 13.5,
                              fontWeight: 800,
                              color: "#6C77C1",
                            }}
                          >
                            {effectiveVal}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustValue(rec, 1)}
                            aria-label={`Aumentar meta sugerida para ${rec.brandName}`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: "none",
                              background: "#FFFFFF",
                              color: "#334155",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span style={{ fontSize: 11.5, color: "#64748B" }}>
                          / mes
                        </span>
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleDismissSingle(rec)}
                          style={{
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            background: "#FFFFFF",
                            color: "#64748B",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySingle(rec)}
                          style={{
                            height: 32,
                            padding: "0 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "#F0F1F9",
                            color: "#6C77C1",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Check size={13} />
                          <span>Aplicar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "28px 20px",
                  textAlign: "center",
                  borderRadius: 14,
                  background: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
                    marginBottom: 4,
                  }}
                >
                  ¡Todas las sugerencias automáticas están al día!
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "#64748B",
                    margin: "0 0 12px",
                  }}
                >
                  Has aplicado o revisado todas las recomendaciones de entregas
                  mensuales para tus marcas.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView("metricas")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: "1px solid #D9DCF0",
                    background: "#F0F1F9",
                    color: "#6C77C1",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ver métricas semanales de pauta →
                </button>
              </div>
            )
          ) : (
            /* Weekly Ad Metrics View */
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {metrics.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMetricChecked(m.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 12,
                    border: m.checked
                      ? "1px solid #D9DCF0"
                      : "1px solid #E2E8F0",
                    background: m.checked ? "#F5F7FF" : "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={m.checked}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMetricChecked(m.id);
                      }}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: m.checked ? "none" : "1.5px solid #CBD5E1",
                        background: m.checked ? "#6C77C1" : "#FFFFFF",
                        color: "#FFFFFF",
                        display: "grid",
                        placeItems: "center",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      {m.checked && <Check size={12} strokeWidth={3} />}
                    </button>

                    <MetricCardIcon type={m.icon} />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>
                        {m.subtitle}
                      </div>
                    </div>
                  </div>

                  {m.checked && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        Meta
                      </span>
                      <input
                        type="text"
                        value={m.target}
                        onChange={(e) =>
                          updateMetricTarget(m.id, e.target.value)
                        }
                        aria-label={`Meta para ${m.title}`}
                        style={{
                          width: 66,
                          height: 30,
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          textAlign: "center",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #F1F5F9",
            background: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "#64748B" }}>
            Se guarda automáticamente en{" "}
            <strong style={{ color: "#334155" }}>Salud de Cuentas</strong>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApplyAll}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "#6C77C1",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgba(91, 103, 202, 0.28)",
              }}
            >
              <Sparkles size={13} />
              <span>
                Aplicar todas las sugerencias ({pendingRecommendations.length})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoSuggestionsModal;
