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
    <div
      style={{
        background: "#F4E9D8",
        borderRight: "1px solid #DFCBB0",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#6B4C30",
          }}
        >
          Mis libretas ({notebooks.length})
        </span>
        <button
          type="button"
          onClick={onStartNew}
          style={{
            padding: "3px 8px",
            borderRadius: 7,
            border: "1px solid #C59B6D",
            background: isCreatingNew ? "#3A2210" : "#FAF5EC",
            color: isCreatingNew ? "#FFFFFF" : "#3A2210",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
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
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 10px",
              borderRadius: 10,
              border: selected
                ? "1px solid #8C6239"
                : "1px solid transparent",
              background: selected ? "#FAF5EC" : "transparent",
              color: "#2C1A0B",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: "#8C6239",
                textTransform: "uppercase",
              }}
            >
              {nb.category || nb.stamp || "LIBRETA"}
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: selected ? 800 : 600,
                lineHeight: 1.25,
              }}
            >
              {nb.title}
            </span>
            <span style={{ fontSize: 10.5, color: "#785A3C" }}>
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
