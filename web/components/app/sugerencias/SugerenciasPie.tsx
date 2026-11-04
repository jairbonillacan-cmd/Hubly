"use client";

import {
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

interface SugerenciasPieProps {
  pendingCount: number;
  onClose: () => void;
  onApplyAll: () => void;
}

export function SugerenciasPie({
  pendingCount,
  onClose,
  onApplyAll,
}: SugerenciasPieProps) {
  return (
    <div className="hubly-sugerencias-footer">
      <span className="hubly-sugerencias-footer-note">
        Se guarda automáticamente en <strong>Salud de Cuentas</strong>
      </span>

      <div className="hubly-sugerencias-footer-actions">
        <button
          type="button"
          onClick={onClose}
          className="hubly-sugerencias-btn-cancel"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onApplyAll}
          className="hubly-sugerencias-btn-apply-all"
        >
          <Sparkles size={13} />
          <span>Aplicar todas las sugerencias ({pendingCount})</span>
        </button>
      </div>
    </div>
  );
}
