"use client";

import {
  HublyCheckIcon as Check,
  HublyMinusIcon as Minus,
  HublyPlusIcon as Plus,
  HublyPulseIcon as TrendingUp,
} from "@/components/app/icons/DuotoneIcons";
import {
  computeRecommendationDelta,
  resolveRecommendationMetricTitle,
} from "@/lib/domain/recommendations";
import type { AccountRecommendation } from "@/lib/types";

interface SugerenciasCuerpoProps {
  recommendations: AccountRecommendation[];
  customValues: Record<string, number>;
  onAdjustValue: (rec: AccountRecommendation, delta: number) => void;
  onApplySingle: (rec: AccountRecommendation) => void;
  onDismissSingle: (rec: AccountRecommendation) => void;
  onSwitchToMetrics: () => void;
}

export function SugerenciasCuerpo({
  recommendations,
  customValues,
  onAdjustValue,
  onApplySingle,
  onDismissSingle,
  onSwitchToMetrics,
}: SugerenciasCuerpoProps) {
  if (recommendations.length === 0) {
    return (
      <div className="hubly-sugerencias-empty">
        <div className="hubly-sugerencias-empty-title">
          Todas las sugerencias automáticas están al día
        </div>
        <p className="hubly-sugerencias-empty-desc">
          Has aplicado o revisado todas las recomendaciones de entregas
          mensuales para tus marcas.
        </p>
        <button
          type="button"
          onClick={onSwitchToMetrics}
          className="hubly-sugerencias-empty-btn"
        >
          Ver métricas semanales de pauta →
        </button>
      </div>
    );
  }

  return (
    <>
      {recommendations.map((rec) => {
        const { effectiveValue, diffAbs, diffPct } = computeRecommendationDelta(
          rec,
          customValues
        );
        const metricTitle = resolveRecommendationMetricTitle(rec);

        return (
          <div key={rec.id} className="hubly-sugerencias-card">
            <div className="hubly-sugerencias-card-top">
              <div className="hubly-sugerencias-brand-group">
                <div
                  className="hubly-sugerencias-brand-avatar"
                  style={{ background: rec.brandColor }}
                >
                  {rec.brandInitial}
                </div>
                <div>
                  <div className="hubly-sugerencias-brand-head">
                    <span className="hubly-sugerencias-brand-name">
                      {rec.brandName}
                    </span>
                    <span className="hubly-sugerencias-metric-pill">
                      {metricTitle}
                    </span>
                  </div>
                  <div className="hubly-sugerencias-brand-meta">
                    Compromiso actual:{" "}
                    <strong>{rec.currentCommitted}/mes</strong> · Completado mes
                    pasado: <strong>{rec.completedLastPeriod}</strong>
                  </div>
                </div>
              </div>

              <span
                className="hubly-sugerencias-delta"
                data-negative={diffAbs < 0 || undefined}
              >
                <TrendingUp size={13} />
                <span>
                  {diffAbs >= 0 ? `+${diffAbs}` : diffAbs} (
                  {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`})
                </span>
              </span>
            </div>

            <div className="hubly-sugerencias-reason-box">
              <div>{rec.reason}</div>
              <div className="hubly-sugerencias-source-label">
                Fuente: {rec.dataSourceLabel}
              </div>
            </div>

            <div className="hubly-sugerencias-card-bottom">
              <div className="hubly-sugerencias-stepper-group">
                <span className="hubly-sugerencias-stepper-label">
                  Nuevo compromiso sugerido:
                </span>

                <div className="hubly-sugerencias-stepper">
                  <button
                    type="button"
                    onClick={() => onAdjustValue(rec, -1)}
                    aria-label={`Disminuir meta sugerida para ${rec.brandName}`}
                    className="hubly-sugerencias-step-btn"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="hubly-sugerencias-step-val">
                    {effectiveValue}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustValue(rec, 1)}
                    aria-label={`Aumentar meta sugerida para ${rec.brandName}`}
                    className="hubly-sugerencias-step-btn"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="hubly-sugerencias-step-unit">/ mes</span>
              </div>

              <div className="hubly-sugerencias-card-actions">
                <button
                  type="button"
                  onClick={() => onDismissSingle(rec)}
                  className="hubly-sugerencias-btn-dismiss"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => onApplySingle(rec)}
                  className="hubly-sugerencias-btn-apply"
                >
                  <Check size={13} />
                  <span>Aplicar</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
