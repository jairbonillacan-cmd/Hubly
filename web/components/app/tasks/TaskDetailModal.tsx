"use client";

import { Modal } from "@/components/app/ui/Modal";
import { useEffect, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { askConfirm } from "@/components/app/AppDialogHost";
import { dueLabelFor } from "@/lib/date";
import type { AgencyTask } from "@/lib/types";
import { normalizedStatus } from "./task-utils";
import {
  HublyCloseIcon as X,
} from "@/components/app/icons/DuotoneIcons";

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
    <Modal open onClose={onClose} label="Editar tarea" className="hubly-sheet hubly-cal-modal hubly-task-modal" onSubmit={save}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título" style={{ ...field, flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700 }} />
        <button type="button" aria-label="Cerrar" onClick={onClose} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ui-text-4)", display: "grid" }}>
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
      {error && <span role="alert" style={{ color: "var(--ui-danger-text)", fontSize: 12.5 }}>{error}</span>}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={async () => {
            if (await askConfirm(`¿Eliminar la tarea «${task.title}»?`)) {
              deleteTask(task.id);
              onClose();
            }
          }}
          style={{ border: "1px solid var(--ui-danger-border)", background: "var(--ui-danger-soft)", color: "var(--ui-danger-text)", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          Eliminar
        </button>
        <button type="submit" style={{ border: 0, background: "var(--hb-accent)", color: "var(--on-accent)", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Guardar
        </button>
      </div>
    </Modal>
  );
}

const field = { width: "100%", border: "1px solid var(--ui-border-strong)", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "var(--ui-surface)" } as const;
const lab = { display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--ui-text-3)" } as const;
