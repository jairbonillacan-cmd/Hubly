"use client";

import {
  HublyCheckIcon as Check,
  HublyMinusIcon as Minus,
  HublyPlusIcon as Plus,
  HublyPulseIcon as TrendingUp,
} from "@/components/app/icons/DuotoneIcons";
import { MetricCardIcon } from "./AutoSuggestionsModal-shared";
import type { AutoSuggestionsModalModel } from "./useAutoSuggestionsModal";

export function SugerenciasCuerpo({ view }: { view: AutoSuggestionsModalModel }) {
  const { activeView, setActiveView, metrics, feedbackBanner, pendingRecommendations, getEffectiveValue, getMetricTitle, handleAdjustValue, handleApplySingle, handleDismissSingle, toggleMetricChecked, updateMetricTarget } = view;

  return (
    <>
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
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
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
                              color: "var(--ui-text)",
                            }}
                          >
                            {rec.brandName}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "var(--ui-muted)",
                              color: "var(--ui-text-2)",
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
                            color: "var(--ui-text-4)",
                            marginTop: 2,
                          }}
                        >
                          Compromiso actual:{" "}
                          <strong style={{ color: "var(--ui-text)" }}>
                            {rec.currentCommitted}/mes
                          </strong>{" "}
                          · Completado mes pasado:{" "}
                          <strong style={{ color: "var(--ui-text)" }}>
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
                        background: diffAbs >= 0 ? "#DCFCE7" : "#E6F4FB",
                        color: diffAbs >= 0 ? "#15803D" : "var(--ui-accent-text)",
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
                      background: "var(--ui-surface-2)",
                      border: "1px solid var(--ui-muted)",
                      fontSize: 12,
                      color: "var(--ui-text-2)",
                      lineHeight: 1.45,
                    }}
                  >
                    <div>{rec.reason}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ui-text-4)",
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
                          color: "var(--ui-text-3)",
                        }}
                      >
                        Nuevo compromiso sugerido:
                      </span>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "var(--ui-surface-2)",
                          border: "1px solid var(--ui-border-strong)",
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
                            background: "var(--ui-surface)",
                            color: "var(--ui-text-2)",
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
                            color: "var(--hb-accent-text)",
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
                            background: "var(--ui-surface)",
                            color: "var(--ui-text-2)",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>
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
                          border: "1px solid var(--ui-border)",
                          background: "var(--ui-surface)",
                          color: "var(--ui-text-4)",
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
                          background: "var(--ui-accent-soft)",
                          color: "var(--hb-accent-text)",
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
                background: "var(--ui-surface-2)",
                border: "1px dashed var(--ui-border-strong)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  marginBottom: 4,
                }}
              >
                ¡Todas las sugerencias automáticas están al día!
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ui-text-4)",
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
                  border: "1px solid var(--ui-sky-border)",
                  background: "var(--ui-accent-soft)",
                  color: "var(--hb-accent-text)",
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
                    ? "1px solid #BFE2F4"
                    : "1px solid #E2E8F0",
                  background: m.checked ? "#F5F7FF" : "var(--ui-surface)",
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
                      border: m.checked ? "none" : "1.5px solid var(--ui-border-strong)",
                      background: m.checked ? "var(--hb-accent)" : "var(--ui-surface)",
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
                        color: "var(--ui-text)",
                      }}
                    >
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>
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
                        color: "var(--ui-text-4)",
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
                        border: "1px solid var(--ui-border-strong)",
                        background: "var(--ui-surface)",
                        textAlign: "center",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
