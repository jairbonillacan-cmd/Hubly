"use client";

import { useState } from "react";
import { HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { useLayer } from "@/lib/use-layer";
import type { BrandProject } from "@/lib/types";

const STATUSES: BrandProject["status"][] = ["En curso", "Revisión", "Completado"];

export function ProjectEditModal({ project, onClose }: { project: BrandProject; onClose: () => void }) {
  const updateProject = useHublyStore((s) => s.updateProject);
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [dueDate, setDueDate] = useState(project.dueDate);
  useLayer(true, onClose);

  return (
    <div className="hubly-picker-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="hubly-picker hubly-social-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Editar ${project.title}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          updateProject(project.id, { title: title.trim(), description: description.trim(), status, progress, dueDate });
          onClose();
        }}
      >
        <header className="hubly-picker-head">
          <div><h2>Editar proyecto</h2></div>
          <button type="button" aria-label="Cerrar" autoFocus onClick={onClose}><HublyCloseIcon size={18} /></button>
        </header>
        <div className="hubly-social-modal-body hubly-import-map">
          <label>Nombre<input className="hubly-cal-input" required disabled={readOnly} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Descripción<textarea className="hubly-composer-caption" disabled={readOnly} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label>
            Estado
            <select className="hubly-cal-input" disabled={readOnly} value={status} onChange={(e) => setStatus(e.target.value as BrandProject["status"])}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Avance: {progress}%<input type="range" min={0} max={100} step={5} disabled={readOnly} value={progress} onChange={(e) => setProgress(Number(e.target.value))} /></label>
          <label>Fecha límite<input className="hubly-cal-input" type="date" disabled={readOnly} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        </div>
        <footer className="hubly-picker-foot">
          <span />
          <button type="button" className="hubly-media-ghost" onClick={onClose}>Cancelar</button>
          {!readOnly && <button type="submit" className="hubly-media-primary">Guardar</button>}
        </footer>
      </form>
    </div>
  );
}
