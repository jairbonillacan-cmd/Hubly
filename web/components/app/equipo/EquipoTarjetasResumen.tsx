"use client";

import type { EvaluatedTeamMember, TeamProductivityPeriod } from "@/lib/domain/team";
import type { BrandWorkspace } from "@/lib/types";

interface EquipoTarjetasResumenProps {
  member: EvaluatedTeamMember;
  teamPeriod: TeamProductivityPeriod;
  assignedBrands: BrandWorkspace[];
}

export function EquipoTarjetasResumen({
  member,
  teamPeriod,
  assignedBrands,
}: EquipoTarjetasResumenProps) {
  return (
    <>
      <div className="hubly-equipo-metrics-strip">
        <span className="hubly-equipo-metrics-period">
          {teamPeriod === "7d"
            ? "Últimos 7 días"
            : teamPeriod === "90d"
              ? "Últimos 90 días"
              : "Últimos 30 días"}
        </span>

        <div className="hubly-equipo-metrics-group">
          <span className="hubly-equipo-metrics-tag">TAREAS</span>
          <span className="hubly-equipo-metrics-item">
            <strong className="hubly-equipo-metrics-val-lg">
              {member.completedTasksCount > 0
                ? member.completedTasksCount
                : "—"}
            </strong>
            terminadas
          </span>
          <span className="hubly-equipo-metrics-item">
            <strong className="hubly-equipo-metrics-val-md">
              {member.inProgressTasksCount}
            </strong>
            en curso
          </span>
          <span className="hubly-equipo-metrics-item">
            <strong className="hubly-equipo-metrics-val-muted">
              {member.avgCycleFormatted}
            </strong>
            por tarea
          </span>
        </div>

        <div className="hubly-equipo-metrics-divider" />

        <div className="hubly-equipo-metrics-group-compact">
          <span className="hubly-equipo-metrics-tag">POSTS</span>
          <span className="hubly-equipo-metrics-item">
            <strong className="hubly-equipo-metrics-val-lg">
              {member.publishedPostsCount > 0
                ? member.publishedPostsCount
                : "—"}
            </strong>
            publicados
          </span>
        </div>

        <div className="hubly-equipo-metrics-divider" />

        <div className="hubly-equipo-metrics-group-compact">
          <span className="hubly-equipo-metrics-tag">TIEMPO</span>
          <span className="hubly-equipo-metrics-item">
            <strong className="hubly-equipo-metrics-val-time">
              {member.activeTimeFormatted}
            </strong>{" "}
            activo
          </span>
        </div>
      </div>

      <div className="hubly-equipo-brands-strip">
        {assignedBrands.map((b) => (
          <div key={b.id} className="hubly-equipo-brand-badge-item">
            <div className="hubly-equipo-brand-squircle">
              {b.initials.slice(0, 1)}
            </div>
            <span className="hubly-equipo-brand-badge-name">{b.name}</span>
          </div>
        ))}
      </div>
    </>
  );
}
