"use client";

import { Modal } from "@/components/app/ui/Modal";
import {
  HublyCloseIcon as X,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import type { SampleAdCard } from "@/lib/domain/ads";

interface AnunciosDiagnosticoProps {
  selectedAd: SampleAdCard | null;
  onClose: () => void;
}

export function AnunciosDiagnostico({
  selectedAd,
  onClose,
}: AnunciosDiagnosticoProps) {
  return (
    <>
      {selectedAd && (
        <Modal open onClose={onClose} label="Ejemplo de diagnóstico">
          <div className="hubly-anuncios-diag-head">
            <span className="hubly-anuncios-diag-badge">
              <Sparkles size={13} /> Ejemplo de diagnóstico
            </span>
            <button
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={onClose}
              className="hubly-anuncios-diag-close"
            >
              <X size={18} />
            </button>
          </div>

          <p className="hubly-anuncios-diag-note">
            Hubi todavía no analiza anuncios.
          </p>

          <h3 className="hubly-anuncios-diag-title">{selectedAd.title}</h3>

          <p className="hubly-anuncios-diag-insight">{selectedAd.aiInsight}</p>

          <div className="hubly-anuncios-diag-stats">
            <div>
              <div className="hubly-anuncios-diag-stat-label">Click Score</div>
              <div className="hubly-anuncios-diag-stat-val is-score">
                {selectedAd.clickScore}/100
              </div>
            </div>
            <div>
              <div className="hubly-anuncios-diag-stat-label">Resultados</div>
              <div className="hubly-anuncios-diag-stat-val">
                {selectedAd.resultados}
              </div>
            </div>
            <div>
              <div className="hubly-anuncios-diag-stat-label">Costo/Res.</div>
              <div className="hubly-anuncios-diag-stat-val">
                {selectedAd.costoResultado}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
