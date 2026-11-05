"use client";

import type { NotebookItem } from "@/lib/types";
import { HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";

interface LibretaListaProps {
  notebooks: NotebookItem[];
  currentNotebookId: string | null;
  isCreatingNew: boolean;
  onSelectNotebook: (id: string) => void;
  onStartNew: () => void;
}

export function LibretaLista({
  notebooks,
  currentNotebookId,
  isCreatingNew,
  onSelectNotebook,
  onStartNew,
}: LibretaListaProps) {
  return (
    <div className="hubly-notebooks-sidebar">
      <div className="hubly-notebooks-sidebar-head">
        <span className="hubly-notebooks-sidebar-title">
          Mis libretas ({notebooks.length})
        </span>
        <button
          type="button"
          onClick={onStartNew}
          className="hubly-notebooks-new-btn"
          data-active={isCreatingNew || undefined}
        >
          <Plus size={11} /> Nueva
        </button>
      </div>

      {notebooks.map((nb) => {
        const selected = !isCreatingNew && currentNotebookId === nb.id;
        return (
          <button
            key={nb.id}
            aria-pressed={selected}
            type="button"
            onClick={() => onSelectNotebook(nb.id)}
            className="hubly-notebooks-item"
          >
            <span className="hubly-notebooks-item-cat">
              {nb.category || nb.stamp || "LIBRETA"}
            </span>
            <span className="hubly-notebooks-item-title">{nb.title}</span>
            <span className="hubly-notebooks-item-date">
              Actualizado:{" "}
              {new Date(nb.updatedAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
