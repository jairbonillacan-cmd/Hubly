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
    <div
      style={{
        padding: "12px 22px 12px 32px",
        background: "#F4E9D8",
        borderTop: "1px solid #DFCBB0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href="/tareas?seccion=libretas"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: "#5C3D22",
            textDecoration: "none",
          }}
        >
          <span>Abrir en Mi espacio</span>
          <ExternalLink size={12} />
        </Link>

        <button
          type="button"
          onClick={onSendPendingToTasks}
          style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #C59B6D", background: "#FAF5EC", color: "#3A2210", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
        >
          Enviar pendientes a Tareas
        </button>
        {taskNotice && <span role="status" style={{ fontSize: 11.5, fontWeight: 600, color: "#3A2210" }}>{taskNotice}</span>}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid var(--ui-danger-border)",
              background: "var(--ui-danger-soft)",
              color: "var(--ui-danger-text)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Trash2 size={12} />
            <span>Eliminar</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 35,
            padding: "0 14px",
            borderRadius: 9,
            border: "1px solid #C59B6D",
            background: "#FAF5EC",
            color: "#3A2210",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Cerrar
        </button>

        <button
          type="submit"
          form="notebook-reader-form"
          style={{
            height: 35,
            padding: "0 16px",
            borderRadius: 9,
            border: "none",
            background: "#3A2210",
            color: "var(--on-accent)",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
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
