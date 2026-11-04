"use client";

import {
  HublyCloseIcon as X,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

interface SugerenciasCabeceraProps {
  titleId: string;
  brandsCount: number;
  activeView: "reglas" | "metricas";
  pendingCount: number;
  onSelectView: (view: "reglas" | "metricas") => void;
  onClose: () => void;
}

export function SugerenciasCabecera({
  titleId,
  brandsCount,
  activeView,
  pendingCount,
  onSelectView,
  onClose,
}: SugerenciasCabeceraProps) {
  return (
    <>
      <div className="hubly-sugerencias-header">
        <div className="hubly-sugerencias-header-main">
          <div className="hubly-sugerencias-header-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 id={titleId} className="hubly-sugerencias-title">
              Sugerencias automáticas de compromisos
            </h2>
            <p className="hubly-sugerencias-subtitle">
              Recomendaciones calculadas con reglas determinísticas sobre el
              cumplimiento real del último mes en tus {brandsCount} marcas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar sugerencias automáticas"
          className="hubly-sugerencias-close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="hubly-sugerencias-modebar">
        <div className="hubly-sugerencias-tabs">
          <button
            autoFocus
            type="button"
            aria-pressed={activeView === "reglas"}
            onClick={() => onSelectView("reglas")}
            className="hubly-sugerencias-tab"
          >
            Recomendaciones por marca ({pendingCount})
          </button>
          <button
            type="button"
            aria-pressed={activeView === "metricas"}
            onClick={() => onSelectView("metricas")}
            className="hubly-sugerencias-tab"
          >
            Métricas semanales de pauta
          </button>
        </div>

        <span className="hubly-sugerencias-audit-note">
          Motor de reglas local · Auditable
        </span>
      </div>
    </>
  );
}
