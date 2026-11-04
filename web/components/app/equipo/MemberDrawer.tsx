"use client";

import { useEffect, useMemo } from "react";
import { Modal } from "@/components/app/ui/Modal";
import { useHublyStore } from "@/lib/store";
import { addDays, dueLabelFor, localIsoDate } from "@/lib/date";
import { HublyCloseIcon as X } from "@/components/app/icons/DuotoneIcons";

const HEATMAP_DAYS = 49;
const STEP_INDEXES = [0, 1, 2, 3, 4] as const;
const stepFor = (count: number) =>
  count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

export function MemberDrawer({
  memberId,
  onClose,
}: {
  memberId: string;
  onClose: () => void;
}) {
  const team = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const events = useHublyStore((s) => s.activityEvents);
  const tasks = useHublyStore((s) => s.tasks);
  const member = useMemo(
    () => team.find((m) => m.id === memberId),
    [team, memberId]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const today = localIsoDate();
  const days = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.memberId !== memberId) continue;
      const key = localIsoDate(new Date(e.timestamp));
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from({ length: HEATMAP_DAYS }, (_, i) => {
      const date = addDays(today, i - HEATMAP_DAYS + 1);
      return { date, count: counts.get(date) || 0 };
    });
  }, [events, memberId, today]);

  if (!member) return null;
  const total = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const memberBrands = brands.filter((b) => member.brandIds?.includes(b.id));
  const open = tasks
    .filter(
      (t) =>
        (t.assigneeId === member.id || t.assigneeName === member.name) &&
        !t.completed
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Modal
      open
      onClose={onClose}
      label={`Perfil de ${member.name}`}
      overlayClassName="hubly-overlay hubly-member-overlay"
      className="hubly-member-drawer"
    >
      <div className="hubly-equipo-drawer-head">
        <span
          className="hubly-equipo-drawer-avatar"
          style={{ background: member.avatarColor || "var(--hb-accent)" }}
        >
          {member.initials}
        </span>
        <div className="hubly-equipo-drawer-title-wrap">
          <h2 className="hubly-equipo-drawer-title">{member.name}</h2>
          <div className="hubly-equipo-drawer-meta">
            {member.role} · {member.email}
          </div>
        </div>
        <button
          type="button"
          autoFocus
          aria-label="Cerrar perfil"
          onClick={onClose}
          className="hubly-equipo-drawer-close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="hubly-equipo-drawer-stats">
        {[
          ["Tareas hechas", member.tasksCompleted],
          ["En curso", member.tasksInProgress],
          ["Publicados", member.postsPublished],
        ].map(([label, value]) => (
          <div key={label} className="hubly-equipo-drawer-stat-box">
            <div className="hubly-equipo-drawer-stat-label">{label}</div>
            <div className="hubly-equipo-drawer-stat-val">{value}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="hubly-equipo-drawer-h3">
          Actividad de las últimas 7 semanas
        </h3>
        <div
          role="img"
          aria-label={`${total} actividades en ${activeDays} días`}
          className="hubly-equipo-drawer-heatmap"
        >
          {days.map((d) => (
            <span
              key={d.date}
              title={`${d.date}: ${d.count} actividades`}
              data-step={stepFor(d.count)}
              data-today={d.date === today}
              className="hubly-equipo-drawer-cell"
            />
          ))}
        </div>
        <div className="hubly-equipo-drawer-legend">
          Menos
          {STEP_INDEXES.map((step) => (
            <span
              key={step}
              data-step={step}
              className="hubly-equipo-drawer-cell hubly-equipo-drawer-legend-box"
            />
          ))}
          Más · {total} actividades en {activeDays} días
        </div>
      </section>

      <section>
        <h3 className="hubly-equipo-drawer-h3">
          Marcas ({memberBrands.length})
        </h3>
        {memberBrands.length === 0 ? (
          <p className="hubly-equipo-drawer-muted">Sin marcas asignadas.</p>
        ) : (
          <div className="hubly-equipo-drawer-brands">
            {memberBrands.map((b) => (
              <span key={b.id} className="hubly-equipo-drawer-brand-pill">
                {b.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="hubly-equipo-drawer-h3">
          Tareas abiertas ({open.length})
        </h3>
        {open.length === 0 ? (
          <p className="hubly-equipo-drawer-muted">Nada pendiente.</p>
        ) : (
          <ul className="hubly-equipo-drawer-tasks">
            {open.slice(0, 8).map((t) => (
              <li key={t.id} className="hubly-equipo-drawer-task-row">
                <span className="hubly-equipo-drawer-task-title">
                  {t.title}
                </span>
                <span
                  data-overdue={t.dueDate < today}
                  className="hubly-equipo-drawer-task-due"
                >
                  {dueLabelFor(t.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}
