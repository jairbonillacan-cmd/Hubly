"use client";

import { Modal } from "@/components/app/ui/Modal";
import { useEffect, useMemo } from "react";
import { useHublyStore } from "@/lib/store";
import { addDays, dueLabelFor, localIsoDate } from "@/lib/date";
import {
  HublyCloseIcon as X,
} from "@/components/app/icons/DuotoneIcons";

const HEATMAP_DAYS = 49;
const STEPS = ["#F1F5F9", "#BFE2F4", "#9099D3", "var(--hb-accent)", "var(--hb-accent-edge)"];
const stepFor = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4);

export function MemberDrawer({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const member = useHublyStore((s) => s.team.find((m) => m.id === memberId));
  const brands = useHublyStore((s) => s.brands);
  const events = useHublyStore((s) => s.activityEvents);
  const tasks = useHublyStore((s) => s.tasks);

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
    .filter((t) => (t.assigneeId === member.id || t.assigneeName === member.name) && !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Modal open onClose={onClose} label={`Perfil de ${member.name}`} overlayClassName="hubly-overlay hubly-member-overlay" className="hubly-member-drawer">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 46, height: 46, borderRadius: 999, background: member.avatarColor || "var(--hb-accent)", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 700 }}>{member.initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{member.name}</h2>
          <div style={{ fontSize: 12.5, color: "var(--ui-text-4)" }}>{member.role} · {member.email}</div>
        </div>
        <button type="button" autoFocus aria-label="Cerrar perfil" onClick={onClose} style={{ border: 0, background: "transparent", color: "var(--ui-text-4)", cursor: "pointer", display: "grid" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          ["Tareas hechas", member.tasksCompleted],
          ["En curso", member.tasksInProgress],
          ["Publicados", member.postsPublished],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid var(--ui-border)", borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 style={h3}>Actividad de las últimas 7 semanas</h3>
        <div role="img" aria-label={`${total} actividades en ${activeDays} días`} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, maxWidth: 260 }}>
          {days.map((d) => (
            <span
              key={d.date}
              title={`${d.date}: ${d.count} actividades`}
              style={{ aspectRatio: "1", borderRadius: 4, background: STEPS[stepFor(d.count)], outline: d.date === today ? "1.5px solid #0F172A" : undefined }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--ui-text-4)", marginTop: 8 }}>
          Menos
          {STEPS.map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />)}
          Más · {total} actividades en {activeDays} días
        </div>
      </section>

      <section>
        <h3 style={h3}>Marcas ({memberBrands.length})</h3>
        {memberBrands.length === 0 ? <p style={muted}>Sin marcas asignadas.</p> : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {memberBrands.map((b) => <span key={b.id} style={{ fontSize: 12.5, fontWeight: 600, background: "var(--ui-muted)", borderRadius: 999, padding: "3px 10px" }}>{b.name}</span>)}
          </div>
        )}
      </section>

      <section>
        <h3 style={h3}>Tareas abiertas ({open.length})</h3>
        {open.length === 0 ? <p style={muted}>Nada pendiente.</p> : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {open.slice(0, 8).map((t) => (
              <li key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.title}</span>
                <span style={{ flexShrink: 0, fontSize: 12, color: t.dueDate < today ? "#B91C1C" : "var(--ui-text-4)" }}>{dueLabelFor(t.dueDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}

const h3 = { fontSize: 13.5, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 8px" } as const;
const muted = { fontSize: 12.5, color: "var(--ui-text-4)", margin: 0 } as const;
