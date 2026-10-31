"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { localIsoDate as isoDate } from "@/lib/date";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import type { SocialPost } from "@/lib/types";
import { STATUS_META } from "./status-meta";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(year, month, i - offset + 1));
}

function initialMonth(posts: SocialPost[]) {
  const today = isoDate(new Date());
  const upcoming = posts.map((p) => p.scheduledDate).filter((d) => d >= today).sort()[0];
  const base = upcoming ? new Date(`${upcoming}T12:00:00`) : new Date();
  return { year: base.getFullYear(), month: base.getMonth() };
}

export function PostMonthCalendar({ posts }: { posts: SocialPost[] }) {
  const movePost = useHublyStore((s) => s.movePost);
  const openComposer = useHublyStore((s) => s.openComposer);
  const [view, setView] = useState(() => initialMonth(posts));

  const cells = useMemo(() => monthCells(view.year, view.month), [view]);
  const columns = useMemo(() => cells.map((d) => isoDate(d)), [cells]);
  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns,
    onMove: (id, date) => movePost(id, date),
  });

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };
  const today = isoDate(new Date());
  const title = new Date(view.year, view.month, 1)
    .toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    .replace(" de ", " ");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button type="button" aria-label="Mes anterior" onClick={() => shift(-1)} style={navBtn}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" aria-label="Mes siguiente" onClick={() => shift(1)} style={navBtn}>
          <ChevronRight size={16} />
        </button>
        <strong style={{ fontSize: 15, textTransform: "capitalize" }}>{title}</strong>
        <span style={{ fontSize: 12, color: "#64748B", marginLeft: "auto" }}>
          Arrastra un post para cambiarlo de día
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 720, border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", background: "#E2E8F0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ background: "#F8FAFC", padding: "8px 10px", fontSize: 11.5, fontWeight: 700, color: "#64748B" }}>
                {d}
              </div>
            ))}
            {cells.map((day) => {
              const key = isoDate(day);
              const inMonth = day.getMonth() === view.month;
              const dayPosts = posts
                .filter((p) => p.scheduledDate === key)
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
              return (
                <div
                  key={key}
                  {...getColumnProps(key)}
                  style={{
                    minHeight: 116,
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    background: drag?.overCol === key ? "#F0F1F9" : inMonth ? "#FFFFFF" : "#FAFBFC",
                    boxShadow: drag?.overCol === key ? "inset 0 0 0 1.5px #6C77C1" : undefined,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: key === today ? 800 : 600,
                        color: key === today ? "#FFFFFF" : inMonth ? "#334155" : "#94A3B8",
                        background: key === today ? "#6C77C1" : "transparent",
                        minWidth: 22,
                        height: 22,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {day.getDate()}
                    </span>
                    <button
                      type="button"
                      aria-label={`Nuevo post el ${key}`}
                      onClick={() => openComposer(null, key)}
                      style={{ border: 0, background: "transparent", color: "#94A3B8", cursor: "pointer", padding: 2, display: "grid" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {dayPosts.map((post) => {
                    const st = STATUS_META[post.status];
                    return (
                      <div
                        key={post.id}
                        {...getCardProps(post.id)}
                        onClick={() => openComposer(post.id)}
                        title={`${post.title} · ${st.label}`}
                        style={{
                          borderRadius: 7,
                          padding: "4px 6px",
                          background: st.bg,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          cursor: drag?.id === post.id ? "grabbing" : "grab",
                          opacity: drag?.id === post.id ? 0.35 : 1,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {post.scheduledTime} {post.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#334155",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;
