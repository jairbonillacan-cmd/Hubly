"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Columns,
  Eye,
  EyeOff,
  LayoutGrid,
  RotateCcw,
  X,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import type { DashboardWidgetId } from "@/lib/types";

export interface WidgetConfigModalProps {
  open?: boolean;
  onClose?: () => void;
  isFallbackMount?: boolean;
}

const WIDGET_METADATA: Record<
  DashboardWidgetId,
  { title: string; subtitle: string; badge: string }
> = {
  tareas: {
    title: "Tareas",
    subtitle: "Checklist operativo agrupado por Vencidas, Hoy, Mañana y Próximas.",
    badge: "Operación",
  },
  libretas: {
    title: "Libretas Kraft",
    subtitle: "Cuadernos de estrategia, tono de voz y bitácoras de cliente.",
    badge: "Editorial",
  },
  hoy: {
    title: "Hoy",
    subtitle: "Publicaciones programadas y entregables del día en curso.",
    badge: "Calendario",
  },
  notificaciones: {
    title: "Notificaciones",
    subtitle: "Actividad en vivo del equipo, aprobaciones y alertas de pauta.",
    badge: "Actividad",
  },
  aprobaciones: {
    title: "Aprobaciones",
    subtitle: "Piezas esperando visto bueno del cliente con acción en 1 clic.",
    badge: "Clientes",
  },
  grafica_ads: {
    title: "Gráfica de Ads",
    subtitle: "Curva comparativa de inversión, clics y ROAS de campañas.",
    badge: "Opcional · Ads",
  },
  ads_activos: {
    title: "Ads activos",
    subtitle: "Tarjetas de campañas en circulación, presupuesto y conversiones.",
    badge: "Opcional · Ads",
  },
  proyectos_criticos: {
    title: "Proyectos críticos",
    subtitle: "Proyectos abiertos priorizados por revisión, fecha y avance.",
    badge: "Opcional · Proyectos",
  },
};

let primaryWidgetConfigMounts = 0;

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function WidgetConfigModal({
  open: openProp,
  onClose: onCloseProp,
  isFallbackMount = false,
}: WidgetConfigModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const [suppressedAsFallback, setSuppressedAsFallback] = useState(false);

  useEffect(() => {
    if (!isFallbackMount) {
      primaryWidgetConfigMounts += 1;
      return () => {
        primaryWidgetConfigMounts = Math.max(0, primaryWidgetConfigMounts - 1);
      };
    } else {
      setSuppressedAsFallback(primaryWidgetConfigMounts > 0);
    }
  }, [isFallbackMount]);

  const widgetConfigModalOpen = useHublyStore((s) => s.widgetConfigModalOpen);
  const setWidgetConfigModalOpen = useHublyStore(
    (s) => s.setWidgetConfigModalOpen
  );
  const widgets = useHublyStore((s) => s.widgets);
  const toggleWidgetVisibility = useHublyStore((s) => s.toggleWidgetVisibility);
  const moveWidget = useHublyStore((s) => s.moveWidget);
  const setWidgetSpan = useHublyStore((s) => s.setWidgetSpan);
  const resetWidgetsLayout = useHublyStore((s) => s.resetWidgetsLayout);

  const isOpen =
    !suppressedAsFallback &&
    (openProp !== undefined ? openProp : widgetConfigModalOpen);

  const [notice, setNotice] = useState<string | null>(null);

  const handleClose = () => {
    setNotice(null);
    if (onCloseProp) {
      onCloseProp();
    } else {
      setWidgetConfigModalOpen(false);
    }
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

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const visibleCount = sortedWidgets.filter((w) => w.visible).length;

  const handleToggleVisible = (id: DashboardWidgetId, currentlyVisible: boolean) => {
    if (currentlyVisible && visibleCount <= 1) {
      setNotice("Mantén al menos un widget visible en el Dashboard.");
      return;
    }
    setNotice(null);
    toggleWidgetVisibility(id);
  };

  const handleReset = () => {
    resetWidgetsLayout();
    setNotice("Se restableció la disposición original del tablero.");
    window.setTimeout(() => setNotice(null), 2600);
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
          maxWidth: 660,
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
            padding: "16px 22px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              }}
            >
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                Configurar widgets del Dashboard
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "#64748B",
                }}
              >
                Activa, oculta, cambia el ancho o reordena los {sortedWidgets.length}{" "}
                módulos de Inicio ({visibleCount} visibles)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar configuración de widgets"
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
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 22px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {notice && (
            <div
              role="status"
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                background: "#F0F1F9",
                border: "1px solid #D9DCF0",
                color: "#4C56A0",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {notice}
            </div>
          )}

          {sortedWidgets.map((w, idx) => {
            const meta = WIDGET_METADATA[w.id] || {
              title: w.title,
              subtitle: w.description || "Widget operativo del Dashboard",
              badge: "General",
            };
            const isFirst = idx === 0;
            const isLast = idx === sortedWidgets.length - 1;

            return (
              <div
                key={w.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: w.visible
                    ? "1px solid #CBD5E1"
                    : "1px dashed #CBD5E1",
                  background: w.visible ? "#FFFFFF" : "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  transition: "all 0.15s ease",
                }}
              >
                {/* Left: Visibility Toggle + Title & Description */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flex: "1 1 260px",
                    minWidth: 0,
                  }}
                >
                  <button
                    ref={idx === 0 ? firstActionRef : undefined}
                    type="button"
                    role="switch"
                    aria-checked={w.visible}
                    aria-label={`Mostrar widget ${meta.title}`}
                    onClick={() => handleToggleVisible(w.id, w.visible)}
                    style={{
                      width: 40,
                      height: 24,
                      borderRadius: 9999,
                      border: "none",
                      background: w.visible ? "#6C77C1" : "#CBD5E1",
                      padding: 2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: w.visible ? "flex-end" : "flex-start",
                      flexShrink: 0,
                      transition: "background 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        background: "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(15,23,42,0.2)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {w.visible ? (
                        <Eye size={11} color="#6C77C1" />
                      ) : (
                        <EyeOff size={11} color="#94A3B8" />
                      )}
                    </span>
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: w.visible ? "#0F172A" : "#64748B",
                        }}
                      >
                        {meta.title}
                      </span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: 9999,
                          background: w.visible ? "#F0F1F9" : "#F1F5F9",
                          color: w.visible ? "#6C77C1" : "#64748B",
                          fontSize: 10.5,
                          fontWeight: 600,
                        }}
                      >
                        {meta.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#64748B",
                        marginTop: 2,
                        lineHeight: 1.35,
                      }}
                    >
                      {meta.subtitle}
                    </div>
                  </div>
                </div>

                {/* Right: Column Selector (Izquierda | Derecha) + Order Arrows */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {/* Width switcher */}
                  <div
                    role="group"
                    aria-label={`Ancho para ${meta.title}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#F1F5F9",
                      padding: 2,
                      borderRadius: 8,
                      gap: 2,
                    }}
                  >
                    {([1, 2, 3] as const).map((span) => {
                      const isCurrent = (w.span ?? 1) === span;
                      return (
                        <button
                          key={span}
                          type="button"
                          className="hubly-seg-pill"
                          aria-pressed={isCurrent}
                          aria-label={`${span} ${span === 1 ? "columna" : "columnas"}`}
                          onClick={() => setWidgetSpan(w.id, span)}
                          style={{
                            minWidth: 26,
                            padding: "4px 7px",
                            borderRadius: 6,
                            border: "none",
                            background: isCurrent ? "#FFFFFF" : "transparent",
                            color: isCurrent ? "#6C77C1" : "#64748B",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: isCurrent ? "0 1px 2px rgba(15,23,42,0.08)" : "none",
                          }}
                        >
                          {span}×
                        </button>
                      );
                    })}
                  </div>

                  {/* Up / Down Order Buttons */}
                  <div style={{ display: "inline-flex", gap: 4 }}>
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveWidget(w.id, "up")}
                      aria-label={`Mover ${meta.title} hacia arriba`}
                      title="Subir"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        background: isFirst ? "#F8FAFC" : "#FFFFFF",
                        color: isFirst ? "#CBD5E1" : "#475569",
                        display: "grid",
                        placeItems: "center",
                        cursor: isFirst ? "not-allowed" : "pointer",
                        padding: 0,
                      }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveWidget(w.id, "down")}
                      aria-label={`Mover ${meta.title} hacia abajo`}
                      title="Bajar"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        background: isLast ? "#F8FAFC" : "#FFFFFF",
                        color: isLast ? "#CBD5E1" : "#475569",
                        display: "grid",
                        placeItems: "center",
                        cursor: isLast ? "not-allowed" : "pointer",
                        padding: 0,
                      }}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
          <button
            type="button"
            onClick={handleReset}
            style={{
              height: 36,
              padding: "0 13px",
              borderRadius: 10,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#475569",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RotateCcw size={13} />
            <span>Restablecer diseño original</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11.5,
                color: "#64748B",
                marginRight: 4,
              }}
            >
              <Columns size={12} /> Guardado automático en este navegador
            </span>

            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 36,
                padding: "0 18px",
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
              <Check size={14} />
              <span>Listo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WidgetConfigModal;
