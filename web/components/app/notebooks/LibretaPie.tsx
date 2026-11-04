"use client";

import Link from "next/link";
import {
  HublyExternalIcon as ExternalLink,
  HublySaveIcon as Save,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

interface LibretaPieProps {
  isCreatingNew: boolean;
  canDelete: boolean;
  taskNotice: string | null;
  onSendPendingToTasks: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function LibretaPie({
  isCreatingNew,
  canDelete,
  taskNotice,
  onSendPendingToTasks,
  onDelete,
  onClose,
}: LibretaPieProps) {
  return (
    <div className="hubly-notebooks-footer">
      <div className="hubly-notebooks-footer-left">
        <Link
          href="/tareas?seccion=libretas"
          onClick={onClose}
          className="hubly-notebooks-space-link"
        >
          <span>Abrir en Mi espacio</span>
          <ExternalLink size={12} />
        </Link>

        <button
          type="button"
          onClick={onSendPendingToTasks}
          className="hubly-notebooks-tasks-btn"
        >
          Enviar pendientes a Tareas
        </button>
        {taskNotice && (
          <span role="status" className="hubly-notebooks-task-notice">
            {taskNotice}
          </span>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="hubly-notebooks-delete-btn"
          >
            <Trash2 size={12} />
            <span>Eliminar</span>
          </button>
        )}
      </div>

      <div className="hubly-notebooks-footer-right">
        <button
          type="button"
          onClick={onClose}
          className="hubly-notebooks-cancel-btn"
        >
          Cerrar
        </button>

        <button
          type="submit"
          form="notebook-reader-form"
          className="hubly-notebooks-save-btn"
        >
          <Save size={13} />
          <span>
            {isCreatingNew ? "Crear libreta Kraft" : "Guardar cambios"}
          </span>
        </button>
      </div>
    </div>
  );
}
