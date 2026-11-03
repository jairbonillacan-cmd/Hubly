"use client";

import { useHublyStore } from "@/lib/store";
import { openNotebookModal } from "@/components/app/NotebookReaderModal";
import { notebookPlainText } from "@/lib/notebook-content";
import {
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";
import { selectActiveBrand } from "@/lib/domain-selectors";

export function useCreateNotebook() {
  const addNotebook = useHublyStore((s) => s.addNotebook);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  return () => {
    const created = addNotebook({
      title: "Nueva libreta",
      subtitle: "Notas de la marca",
      category: "Libreta",
      brandId: activeBrandId,
      content: "",
    });
    openNotebookModal(created.id);
  };
}

export function NotebooksSection() {
  const notebooks = useHublyStore((s) => s.notebooks);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const createNotebook = useCreateNotebook();

  const visible = notebooks.filter((n) => n.brandId === activeBrandId);
  const brandName = selectActiveBrand(brands, activeBrandId)?.name || "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ui-text)", margin: "0 0 4px" }}>Libretas de {brandName}</h2>
          <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: 0 }}>Minutas, ideas y listas de pendientes. Se guardan mientras escribes.</p>
        </div>
        <button type="button" className="hbtn hbtn-secondary" onClick={createNotebook}>
          <Plus size={16} /> Nueva libreta
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
        {visible.map((nb) => (
          <button
            key={nb.id}
            type="button"
            onClick={() => openNotebookModal(nb.id)}
            style={{
              height: 265,
              border: "1px solid var(--ui-border)",
              font: "inherit",
              textAlign: "left",
              borderRadius: "6px 16px 16px 6px",
              background: "var(--ui-surface)",
              padding: "20px 18px 18px 24px",
              position: "relative",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: "var(--ui-muted)", borderRight: "1px solid var(--ui-border)", borderRadius: "6px 0 0 6px" }} />
            <span style={{ display: "block", width: "100%", background: "var(--ui-surface-2)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--ui-border)" }}>
              <span style={{ display: "block", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ui-text-4)", marginBottom: 4 }}>{nb.category}</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--ui-text)", lineHeight: 1.3 }}>{nb.title}</span>
            </span>
            <span style={{ display: "block", width: "100%" }}>
              <span style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 12.5, color: "var(--ui-text-3)", marginBottom: 8 }}>
                {notebookPlainText(nb.content)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ui-text-4)" }}>
                {new Date(nb.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
              </span>
            </span>
          </button>
        ))}
        <button type="button" onClick={createNotebook} style={{ height: 265, borderRadius: 16, border: "1.5px dashed var(--ui-border-strong)", background: "transparent", color: "var(--hb-accent-text)", fontWeight: 600, fontSize: 13.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={18} /> Nueva libreta
        </button>
      </div>
    </div>
  );
}
