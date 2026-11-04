"use client";

import type { TeamActivityRow } from "@/lib/domain/team";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { HublyPulseIcon as TrendingUp } from "@/components/app/icons/DuotoneIcons";

interface EquipoProgresoProps {
  activeTimeFormatted: string;
  activityRange: "Semana" | "Mes";
  onActivityRangeChange: (range: "Semana" | "Mes") => void;
  activityRows: TeamActivityRow[];
  maxActivityRowMinutes: number;
}

export function EquipoProgreso({
  activeTimeFormatted,
  activityRange,
  onActivityRangeChange,
  activityRows,
  maxActivityRowMinutes,
}: EquipoProgresoProps) {
  return (
    <>
      <p className="hubly-equipo-explainer">
        Los números salen solos del trabajo de cada quien: nadie prende un
        cronómetro. El <strong>ciclo típico</strong> es la mediana desde que nace
        la tarea hasta que se cierra, y el <strong>tiempo activo</strong> son las
        horas que pasó en curso o en revisión — es tiempo transcurrido, no horas
        trabajadas, y se registra desde el 10 de agosto.
      </p>

      <div className="hubly-equipo-card">
        <div className="hubly-equipo-card-head">
          <div className="hubly-equipo-card-title-wrap">
            <TrendingUp size={15} className="hubly-equipo-card-icon" />
            <span className="hubly-equipo-card-title">Tu actividad</span>
          </div>

          <div className="hubly-equipo-card-meta-wrap">
            <span className="hubly-equipo-card-meta">
              {activeTimeFormatted} activo
            </span>
            <div className="hubly-equipo-seg-group">
              {(["Semana", "Mes"] as const).map((r) => {
                const active = activityRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onActivityRangeChange(r)}
                    className="hubly-equipo-seg-btn"
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hubly-equipo-rows-list">
          {activityRows.map((row) => {
            const isToday = row.label === "Hoy" || row.label === "Semana actual";
            const pct = Math.min(
              100,
              Math.round((row.minutes / maxActivityRowMinutes) * 100)
            );
            return (
              <div key={row.key} className="hubly-equipo-activity-row">
                <HublyCatAvatar size={32} />
                <span
                  data-today={isToday}
                  className="hubly-equipo-activity-label"
                >
                  {row.label}
                </span>
                <div
                  data-today={isToday}
                  className="hubly-equipo-activity-track"
                >
                  {row.minutes > 0 && (
                    <div
                      data-today={isToday}
                      className="hubly-equipo-activity-fill"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  )}
                </div>
                <span
                  data-active={row.minutes > 0}
                  className="hubly-equipo-activity-status"
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
