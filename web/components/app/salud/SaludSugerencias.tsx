"use client";

import React, { useState } from "react";
import { Button } from "@/components/app/ui/Button";
import type { AccountRecommendation } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baja: "Oportunidad",
};

const MAX_VISIBLE_RECOMMENDATIONS = 4;

interface SaludSugerenciasProps {
  recommendations: AccountRecommendation[];
  onApplySingle: (rec: AccountRecommendation) => void;
  onDismissSingle: (rec: AccountRecommendation) => void;
  onApplyAll: () => void;
  onOpenConfig: () => void;
}

export function SaludSugerencias({
  recommendations,
  onApplySingle,
  onDismissSingle,
  onApplyAll,
  onOpenConfig,
}: SaludSugerenciasProps) {
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  if (recommendations.length === 0) return null;

  const visibleRecommendations = showAllRecommendations
    ? recommendations
    : recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS);

  return (
    <section
      className="hubly-salud-section"
      aria-label="Sugerencias"
      data-testid="rule-recommendations-panel"
    >
      <div className="hubly-salud-section-head">
        <div>
          <h2>Sugerencias ({recommendations.length})</h2>
          <p>Calculadas con tu historial de cumplimiento, tareas vencidas y presupuesto de pauta.</p>
        </div>
        <div className="hubly-salud-actions">
          {showRecommendations && (
            <Button
              variant="secondary"
              size="sm"
              data-testid="apply-all-recommendations-btn"
              onClick={onApplyAll}
            >
              Aplicar todas ({recommendations.length})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onOpenConfig}>
            Configurar por marca
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showRecommendations}
            onClick={() => setShowRecommendations((v) => !v)}
          >
            {showRecommendations ? "Ocultar" : "Mostrar"}
          </Button>
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
                  <span>
                    Meta {rec.currentCommitted} → {rec.recommendedCommitted}
                  </span>
                  <span>· {PRIORITY_LABEL[(rec.priority || "media").toLowerCase()]}</span>
                </div>
              </div>
              <div className="hubly-salud-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`dismiss-rec-${rec.id}`}
                  onClick={() => onDismissSingle(rec)}
                >
                  Descartar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`apply-rec-${rec.id}`}
                  onClick={() => onApplySingle(rec)}
                >
                  Aplicar
                </Button>
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
  );
}
