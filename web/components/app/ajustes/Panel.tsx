"use client";

import type { ReactNode } from "react";
import { HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";
import { Button } from "@/components/app/ui/Button";
import { Modal } from "@/components/app/ui/Modal";

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
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={title}
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
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" type="submit" disabled={submitDisabled}>{submitLabel}</Button>
      </div>
    </Modal>
  );
}
