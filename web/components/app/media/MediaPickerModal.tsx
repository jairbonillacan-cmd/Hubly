"use client";

import { useEffect, useRef, useState } from "react";
import { HublyCloseIcon as X, HublyLibraryIcon as Library } from "@/components/app/icons/DuotoneIcons";
import type { MediaKind, MediaRecord } from "@/lib/media";
import { useLayer } from "@/lib/use-layer";
import { MediaLibrary } from "./MediaLibrary";

interface MediaPickerModalProps {
  open: boolean;
  brandId: string;
  accept?: MediaKind[];
  maxSelection?: number;
  subtitle?: string;
  onCancel: () => void;
  onConfirm: (selected: MediaRecord[]) => void;
}

/** Content Manager sobre el editor: Escape lo cierra a él solo y el foco vuelve a quien lo abrió. */
export function MediaPickerModal({ open, brandId, accept, maxSelection = 10, subtitle = "Selecciona imágenes o videos", onCancel, onConfirm }: MediaPickerModalProps) {
  const [selected, setSelected] = useState<MediaRecord[]>([]);
  const [counts, setCounts] = useState({ files: 0, folders: 0 });
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useLayer(open, onCancel);

  useEffect(() => {
    if (!open) return;
    // La selección empieza vacía en cada apertura.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected([]);
    closeRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="hubly-picker-scrim" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="hubly-picker" role="dialog" aria-modal="true" aria-labelledby="hubly-picker-title">
        <header className="hubly-picker-head">
          <span className="hubly-picker-icon"><Library size={20} aria-hidden /></span>
          <div>
            <h2 id="hubly-picker-title">Content Manager</h2>
            <p>{subtitle}</p>
          </div>
          <button ref={closeRef} type="button" aria-label="Cerrar Content Manager" onClick={onCancel}>
            <X size={18} />
          </button>
        </header>
        <MediaLibrary brandId={brandId} selectable accept={accept} maxSelection={maxSelection} onSelectionChange={setSelected} onCounts={setCounts} />
        <footer className="hubly-picker-foot">
          <span>
            {selected.length > 0
              ? `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`
              : `${counts.files} archivo${counts.files === 1 ? "" : "s"} · ${counts.folders} carpeta${counts.folders === 1 ? "" : "s"}`}
          </span>
          <button type="button" className="hubly-media-ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className="hubly-media-primary" disabled={selected.length === 0} onClick={() => onConfirm(selected)}>Agregar</button>
        </footer>
      </div>
    </div>
  );
}
