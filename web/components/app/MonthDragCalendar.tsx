"use client";

import React, { useMemo, useState } from "react";
import { localIsoDate } from "@/lib/date";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import {
  HublyChevronLeftIcon as ChevronLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export interface CalendarEntry {
  id: string;
  date: string;
  label: string;
  title: string;
  bg: string;
  color: string;
  sortKey?: string;
  strike?: boolean;
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(year, month, i - offset + 1));
}

function initialMonth(entries: CalendarEntry[]) {
  const today = localIsoDate();
  const upcoming = entries.map((e) => e.date).filter((d) => d >= today).sort()[0];
  const base = upcoming ? new Date(`${upcoming}T12:00:00`) : new Date();
  return { year: base.getFullYear(), month: base.getMonth() };
}

export function MonthDragCalendar({
  entries,
  hint,
  addLabel,
  onMove,
  onOpen,
  onAdd,
  renderTop,
}: {
  entries: CalendarEntry[];
  hint: string;
  addLabel: string;
  onMove: (id: string, date: string) => void;
  onOpen: (id: string) => void;
  onAdd: (date: string) => void;
  renderTop?: (year: number, month: number) => React.ReactNode;
}) {
  const [view, setView] = useState(() => initialMonth(entries));
  const cells = useMemo(() => monthCells(view.year, view.month), [view]);
  const columns = useMemo(() => cells.map((d) => localIsoDate(d)), [cells]);
  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns,
    onMove: (id, date) => onMove(id, date),
  });

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };
  const today = localIsoDate();
  const title = new Date(view.year, view.month, 1)
    .toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    .replace(" de ", " ");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button type="button" aria-label="Mes anterior" onClick={() => shift(-1)} style={navBtn}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" aria-label="Mes siguiente" onClick={() => shift(1)} style={navBtn}>
          <ChevronRight size={16} />
        </button>
        <strong style={{ fontSize: 15, textTransform: "capitalize" }}>{title}</strong>
        <span style={{ fontSize: 12, color: "var(--ui-text-4)", marginLeft: "auto" }}>{hint}</span>
      </div>

      {renderTop?.(view.year, view.month)}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 720, border: "1px solid var(--ui-border)", borderRadius: 14, overflow: "hidden", background: "var(--ui-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ background: "var(--ui-surface-2)", padding: "8px 10px", fontSize: 11.5, fontWeight: 700, color: "var(--ui-text-4)" }}>
                {d}
              </div>
            ))}
            {cells.map((day) => {
              const key = localIsoDate(day);
              const inMonth = day.getMonth() === view.month;
              const dayEntries = entries
                .filter((e) => e.date === key)
                .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""));
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
                    minWidth: 0,
                    background: drag?.overCol === key ? "var(--ui-accent-soft)" : inMonth ? "var(--ui-surface)" : "var(--ui-surface-2)",
                    boxShadow: drag?.overCol === key ? "inset 0 0 0 1.5px var(--hb-accent)" : undefined,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: key === today ? 800 : 600,
                        color: key === today ? "var(--on-accent)" : inMonth ? "var(--ui-text-2)" : "var(--ui-text-5)",
                        background: key === today ? "var(--hb-accent)" : "transparent",
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
                      aria-label={`${addLabel} el ${key}`}
                      onClick={() => onAdd(key)}
                      style={{ border: 0, background: "transparent", color: "var(--ui-text-5)", cursor: "pointer", padding: 2, display: "grid" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      {...getCardProps(entry.id)}
                      onClick={() => onOpen(entry.id)}
                      title={entry.title}
                      style={{
                        borderRadius: 7,
                        padding: "4px 6px",
                        background: entry.bg,
                        color: entry.color,
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        cursor: drag?.id === entry.id ? "grabbing" : "grab",
                        opacity: drag?.id === entry.id ? 0.35 : 1,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        textDecoration: entry.strike ? "line-through" : "none",
                      }}
                    >
                      {entry.label}
                    </div>
                  ))}
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
  border: "1px solid var(--ui-border-strong)",
  background: "var(--ui-surface)",
  color: "var(--ui-text-2)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;
