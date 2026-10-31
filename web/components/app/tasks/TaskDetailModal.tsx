"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { dueLabelFor } from "@/lib/date";
import type { AgencyTask } from "@/lib/types";
import { normalizedStatus } from "./task-utils";

export function TaskDetailModal({
  task,
  listNames,
  onClose,
}: {
  task: AgencyTask;
  listNames: string[];
  onClose: () => void;
}) {
  const updateTask = useHublyStore((s) => s.updateTask);
  const deleteTask = useHublyStore((s) => s.deleteTask);
  const team = useHublyStore((s) => s.team);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assignee, setAssignee] = useState(task.assigneeName || task.assignee);
  const [listName, setListName] = useState(task.listName);
  const [status, setStatus] = useState(normalizedStatus(task));
  const [highlighted, setHighlighted] = useState(Boolean(task.highlighted));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Escribe un título.");
      return;
    }
    const member = team.find((m) => m.name === assignee);
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueLabel: dueLabelFor(dueDate),
      dueBucket: undefined,
      assignee,
      assigneeName: assignee,
      assigneeId: member?.id || task.assigneeId,
      assigneeInitial: assignee.slice(0, 1).toUpperCase(),
      listName,
      status,
      completed: status === "done",
      highlighted,
    });
    onClose();
  };

  const people = Array.from(new Set([assignee, ...team.map((m) => m.name)].filter(Boolean)));

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,0.45)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Editar tarea"
        onSubmit={save}
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "#FFFFFF", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título" style={{ ...field, flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700 }} />
          <button type="button" aria-label="Cerrar" onClick={onClose} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#64748B", display: "grid" }}>
            <X size={18} />
          </button>
        </div>
        <label style={lab}>
          Descripción
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...field, resize: "vertical" }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <label style={lab}>
            Fecha
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={field} />
          </label>
          <label style={lab}>
            Responsable
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={field}>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label style={lab}>
            Lista
            <select value={listName} onChange={(e) => setListName(e.target.value)} style={field}>
              {listNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label style={lab}>
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={field}>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Completada</option>
            </select>
          </label>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={highlighted} onChange={(e) => setHighlighted(e.target.checked)} />
          Resaltar como prioridad
        </label>
        {error && <span role="alert" style={{ color: "#B91C1C", fontSize: 12.5 }}>{error}</span>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar la tarea «${task.title}»?`)) {
                deleteTask(task.id);
                onClose();
              }
            }}
            style={{ border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            Eliminar
          </button>
          <button type="submit" style={{ border: 0, background: "#6C77C1", color: "#FFFFFF", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

const field = { width: "100%", border: "1px solid #CBD5E1", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "#FFFFFF" } as const;
const lab = { display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "#475569" } as const;
