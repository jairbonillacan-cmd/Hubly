"use client";

import {
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import type { AutoSuggestionsModalModel } from "./useAutoSuggestionsModal";

export function SugerenciasPie({ view }: { view: AutoSuggestionsModalModel }) {
  const { pendingRecommendations, handleClose, handleApplyAll } = view;

  return (
    <>
      {/* Footer */}
      <div
        style={{
          padding: "14px 22px",
          borderTop: "1px solid var(--ui-muted)",
          background: "var(--ui-surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
          Se guarda automáticamente en{" "}
          <strong style={{ color: "var(--ui-text-2)" }}>Salud de Cuentas</strong>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid var(--ui-border-strong)",
              background: "var(--ui-surface)",
              color: "var(--ui-text-3)",
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
              background: "var(--hb-accent)",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgb(var(--hb-accent-rgb) / 0.28)",
            }}
          >
            <Sparkles size={13} />
            <span>
              Aplicar todas las sugerencias ({pendingRecommendations.length})
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
