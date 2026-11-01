"use client";

import { useRef, type FormEventHandler, type ReactNode } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Clases de la ventana y del velo. Por defecto, la receta §9.9 de la guía. */
  className?: string;
  overlayClassName?: string;
  /** Con `onSubmit` la ventana es un formulario. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

/** Ventana con velo, animación de salida, Escape, retorno del foco y Tab contenido. */
export function Modal({
  open,
  onClose,
  label,
  children,
  className = "hubly-sheet hubly-cal-modal",
  overlayClassName = "hubly-overlay hubly-cal-overlay",
  onSubmit,
}: ModalProps) {
  const presence = useModalPresence(open);
  const surface = useRef<HTMLElement>(null);
  useLayer(open, onClose);
  useFocusTrap(surface, open);
  if (!presence.mounted) return null;

  const dialog = { className, "data-state": presence.state, role: "dialog", "aria-modal": true, "aria-label": label };
  return (
    <div
      className={overlayClassName}
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form ref={surface as React.RefObject<HTMLFormElement>} {...dialog} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div ref={surface as React.RefObject<HTMLDivElement>} {...dialog}>
          {children}
        </div>
      )}
    </div>
  );
}
