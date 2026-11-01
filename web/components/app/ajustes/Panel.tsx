"use client";

import type { ReactNode } from "react";
import { HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";

export function PanelHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="hubly-ajustes-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="hubly-ajustes-head-actions">{actions}</div>}
    </div>
  );
}

export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="hubly-ajustes-switch" onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

/** Lo que aún no existe se dice sin adornos, con la etiqueta de la guía. */
export function Previsto() {
  return <span className="hubly-ajustes-tag">Función prevista</span>;
}

interface ModalProps {
  open: boolean;
  title: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function AjustesModal({ open, title, submitLabel = "Guardar", submitDisabled, onClose, onSubmit, children }: ModalProps) {
  const presence = useModalPresence(open);
  useLayer(open, onClose);
  if (!presence.mounted) return null;
  return (
    <div
      className="hubly-overlay hubly-cal-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="hubly-sheet hubly-cal-modal"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="hubly-cal-modal-head">
          <h2>{title}</h2>
          <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={onClose}>
            <HublyCloseIcon size={14} />
          </button>
        </div>
        <div className="hubly-cal-modal-scroll">{children}</div>
        <div className="hubly-cal-modal-actions">
          <button type="button" className="hbtn hbtn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="hbtn hbtn-primary" disabled={submitDisabled}>{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
