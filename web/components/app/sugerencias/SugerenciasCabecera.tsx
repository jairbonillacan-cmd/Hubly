"use client";

import {
  HublyCloseIcon as X,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import type { AutoSuggestionsModalModel } from "./useAutoSuggestionsModal";

export function SugerenciasCabecera({ view }: { view: AutoSuggestionsModalModel }) {
  const { titleId, firstActionRef, brands, activeView, setActiveView, pendingRecommendations, handleClose } = view;

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid var(--ui-muted)",
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
              background: "var(--ui-accent-soft)",
              color: "var(--hb-accent-text)",
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
                color: "var(--ui-text)",
                lineHeight: 1.25,
              }}
            >
              Sugerencias automáticas de compromisos
            </h2>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12.5,
                color: "var(--ui-text-4)",
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
            border: "1px solid var(--ui-border)",
            background: "var(--ui-surface-2)",
            color: "var(--ui-text-4)",
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
          background: "var(--ui-surface-2)",
          borderBottom: "1px solid var(--ui-muted)",
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
            background: "var(--ui-border)",
            padding: 3,
            borderRadius: 10,
            gap: 2,
          }}
        >
          <button
            ref={firstActionRef}
            type="button"
            aria-pressed={activeView === "reglas"}
            onClick={() => setActiveView("reglas")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background:
                activeView === "reglas" ? "var(--ui-surface)" : "transparent",
              color: activeView === "reglas" ? "var(--hb-accent)" : "var(--ui-text-3)",
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
            aria-pressed={activeView === "metricas"}
            onClick={() => setActiveView("metricas")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background:
                activeView === "metricas" ? "var(--ui-surface)" : "transparent",
              color: activeView === "metricas" ? "var(--hb-accent)" : "var(--ui-text-3)",
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

        <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 500 }}>
          Motor de reglas local · Auditable
        </span>
      </div>

      {/* Scrollable Content */}
    </>
  );
}
