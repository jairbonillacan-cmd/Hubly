"use client";

import { Modal } from "@/components/app/ui/Modal";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { selectTasksBreakdown } from "@/lib/domain-selectors";
import {
  HublyCheckIcon as Check,
} from "@/components/app/icons/DuotoneIcons";

type TaskGroup = ReturnType<typeof selectTasksBreakdown>["groups"][number];

interface PendientesModalProps {
  open: boolean;
  onClose: () => void;
  groups: TaskGroup[];
  onToggle: (taskId: string) => void;
}

export function PendientesModal({ open, onClose, groups, onToggle }: PendientesModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const urgentGroups = groups.filter(
    (g) => (g.bucket === "overdue" || g.bucket === "today") && g.tasks.length > 0
  );
  const urgentCount = urgentGroups.reduce((total, g) => total + g.tasks.length, 0);
  const allCount = groups.reduce((total, g) => total + g.tasks.length, 0);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <Modal open={open} onClose={onClose} labelledBy="pendientes-title" className="hubly-sheet hubly-cal-modal hubly-pendientes-modal">
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
    </Modal>,
    document.querySelector(".hubly-app-root") ?? document.body
  );
}
