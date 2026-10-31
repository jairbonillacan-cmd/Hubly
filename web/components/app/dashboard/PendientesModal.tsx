"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { selectTasksBreakdown } from "@/lib/domain-selectors";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyCheckIcon as Check,
} from "@/components/app/icons/DuotoneIcons";

type TaskGroup = ReturnType<typeof selectTasksBreakdown>["groups"][number];

export interface PendientesModalProps {
  open: boolean;
  onClose: () => void;
  groups: TaskGroup[];
  onToggle: (taskId: string) => void;
}

export function PendientesModal({ open, onClose, groups, onToggle }: PendientesModalProps) {
  const presence = useModalPresence(open);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const urgentGroups = groups.filter(
    (g) => (g.bucket === "overdue" || g.bucket === "today") && g.tasks.length > 0
  );
  const urgentCount = urgentGroups.reduce((total, g) => total + g.tasks.length, 0);
  const allCount = groups.reduce((total, g) => total + g.tasks.length, 0);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!presence.mounted) return null;

  return createPortal(
    <div
      className="hubly-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15, 23, 42, 0.32)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="hubly-sheet"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pendientes-title"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 22,
          background: "var(--ui-surface)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "20px 24px 16px",
            borderBottom: "1px solid #F1F1F6",
          }}
        >
          <div>
            <h2 id="pendientes-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111C27" }}>
              Lo que te toca
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#6B7886" }}>
              {urgentCount} para hoy
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="hb-widget-badge" style={{ height: 24, padding: "0 10px" }}>
              {urgentCount} de {allCount}
            </span>
            <button ref={closeRef} type="button" className="hbtn hbtn-secondary hbtn-sm" onClick={onClose}>
              Listo
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px", overflowY: "auto" }}>
          {urgentGroups.length === 0 ? (
            <p style={{ margin: 0, padding: "14px 0", textAlign: "center", fontSize: 13, color: "#6B7886" }}>
              Nada vencido ni para hoy.
            </p>
          ) : (
            urgentGroups.map((group) => (
              <div key={group.bucket} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: group.bucket === "overdue" ? "#DC2626" : "var(--hb-accent)",
                  }}
                >
                  {group.label}
                </div>
                <div className="hubly-task-group">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="hubly-task-row"
                      role="checkbox"
                      aria-checked={false}
                      tabIndex={0}
                      onClick={() => onToggle(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggle(task.id);
                        }
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span className="hubly-check" data-done={false}>
                          <Check className="w-2.5 h-2.5 text-white" style={{ opacity: 0 }} />
                        </span>
                        <span className="hubly-task-title">{task.title}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            padding: "14px 24px 18px",
            borderTop: "1px solid #F1F1F6",
          }}
        >
          <span style={{ fontSize: 12, color: "#6B7886" }}>
            Vencidas y de hoy. Lo demás vive en Mi espacio.
          </span>
          <Link href="/tareas" className="hbtn hbtn-secondary hbtn-sm" onClick={onClose}>
            Abrir Mi espacio
          </Link>
        </div>
      </div>
    </div>,
    document.querySelector(".hubly-app-root") ?? document.body
  );
}
