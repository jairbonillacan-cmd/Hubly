"use client";

import { Modal } from "@/components/app/ui/Modal";
import {
  HublyCloseIcon as X,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import type { DemoAnunciosPageModel } from "./useDemoAnunciosPage";

export function AnunciosDiagnostico({ view }: { view: DemoAnunciosPageModel }) {
  const { selectedAd, setSelectedAd } = view;

  return (
    <>
      {selectedAd && (
        <Modal open onClose={() => setSelectedAd(null)} label="Ejemplo de diagnóstico">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              <Sparkles size={13} /> Ejemplo de diagnóstico
            </span>
            <button
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={() => setSelectedAd(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-4)" }}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: "0 0 10px" }}>
            Hubi todavía no analiza anuncios.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 10px" }}>
            {selectedAd.title}
          </h3>

          <p style={{ fontSize: 13.5, color: "var(--ui-text-2)", lineHeight: 1.55, marginBottom: 16 }}>
            {selectedAd.aiInsight}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              background: "var(--ui-surface-2)",
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Click Score</div>
              <div style={{ fontWeight: 800, color: "var(--tinta-exito)", fontSize: 15 }}>
                {selectedAd.clickScore}/100
              </div>
            </div>
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Resultados</div>
              <div style={{ fontWeight: 800, color: "var(--ui-text)", fontSize: 15 }}>
                {selectedAd.resultados}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Costo/Res.</div>
              <div style={{ fontWeight: 800, color: "var(--ui-text)", fontSize: 15 }}>
                {selectedAd.costoResultado}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
