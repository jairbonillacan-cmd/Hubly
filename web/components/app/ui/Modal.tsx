"use client";
import "./ui-kit.css";

import { useRef, type FormEventHandler, type KeyboardEventHandler, type ReactNode, type RefObject } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible: texto directo, o el id del título visible. */
  label?: string;
  labelledBy?: string;
  children: ReactNode;
  /** Clases de la ventana y del velo. Por defecto, la receta §9.9 de la guía. */
  className?: string;
  overlayClassName?: string;
  /** Variante ancha de `.hubly-social-modal`. */
  wide?: boolean;
  /** Para medir o recorrer la ventana desde fuera. */
  surfaceRef?: RefObject<HTMLDivElement | null>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  /** Con `onSubmit` la ventana es un formulario. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

/** Ventana con velo, animación de salida, Escape, retorno del foco y Tab contenido. */
export function Modal({
  open,
  onClose,
  label,
  labelledBy,
  children,
  className = "hubly-sheet hubly-cal-modal",
  overlayClassName = "hubly-overlay hubly-cal-overlay",
  wide,
  surfaceRef,
  onKeyDown,
  onSubmit,
}: ModalProps) {
  const presence = useModalPresence(open);
  const own = useRef<HTMLDivElement>(null);
  const surface = surfaceRef ?? own;
  useLayer(open, onClose);
  useFocusTrap(surface, open);
  if (!presence.mounted) return null;

  const dialog = {
    className,
    "data-state": presence.state,
    "data-wide": wide || undefined,
    role: "dialog",
    "aria-modal": true,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    onKeyDown,
  };
  return (
    <div
      className={overlayClassName}
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form ref={surface as unknown as RefObject<HTMLFormElement>} {...dialog} onSubmit={onSubmit}>
          {children}
        </form>
      ) : (
        <div ref={surface} {...dialog}>
          {children}
        </div>
      )}
    </div>
  );
}
