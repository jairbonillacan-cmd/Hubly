"use client";

import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyPulseIcon as TrendingUp,
} from "@/components/app/icons/DuotoneIcons";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoProgreso({ view }: { view: EquipoViewModel }) {
  const { activityRange, setActivityRange, activeMemberMetrics, activityRows, maxActivityRowMinutes } = view;

  return (
    <>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--ui-text-4)",
          lineHeight: 1.6,
          maxWidth: 680,
          margin: "0 0 28px 0",
        }}
      >
        Los números salen solos del trabajo de cada quien: nadie prende un
        cronómetro. El{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>ciclo típico</strong> es la
        mediana desde que nace la tarea hasta que se cierra, y el{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>tiempo activo</strong> son las
        horas que pasó en curso o en revisión — es tiempo transcurrido, no
        horas trabajadas, y se registra desde el 10 de agosto.
      </p>

      {/* ====================================================================
          6. TU ACTIVIDAD CARD (Weekly / Monthly Breakdown with Real Active Time)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={15} style={{ color: "var(--hb-accent-text)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
              Tu actividad
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ui-text-4)", fontWeight: 600 }}>
              {activeMemberMetrics.activeTimeFormatted} activo
            </span>
            <div
              style={{
                display: "inline-flex",
                background: "var(--ui-muted)",
                padding: 2,
                borderRadius: 8,
              }}
            >
              {(["Semana", "Mes"] as const).map((r) => {
                const active = activityRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActivityRange(r)}
                    style={{
                      border: "none",
                      background: active ? "var(--hb-accent)" : "transparent",
                      color: active ? "#FFFFFF" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rows with Character Stickers & Live Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activityRows.map((row) => {
            const isToday = row.label === "Hoy" || row.label === "Semana actual";
            const pct = Math.min(
              100,
              Math.round((row.minutes / maxActivityRowMinutes) * 100)
            );
            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "36px minmax(72px, 95px) 1fr minmax(84px, auto)",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <HublyCatAvatar size={32} />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                  }}
                >
                  {row.label}
                </span>
                <div
                  style={{
                    height: 24,
                    borderRadius: 7,
                    background: isToday ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border: isToday ? "1px solid #DCEFF9" : "none",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {row.minutes > 0 && (
                    <div
                      style={{
                        width: `${Math.max(8, pct)}%`,
                        height: "100%",
                        background: isToday
                          ? "linear-gradient(90deg, #16324F 0%, var(--hb-accent) 100%)"
                          : "#CBD5E1",
                        opacity: isToday ? 0.88 : 0.65,
                        borderRadius: 6,
                        transition: "width 240ms ease",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    color: row.minutes > 0 ? "var(--ui-text-3)" : "var(--ui-text-4)",
                    fontWeight: row.minutes > 0 ? 600 : 400,
                    textAlign: "right",
                  }}
                >
                  {row.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
