"use client";

import { KraftNotebookCard } from "@/components/app/KraftNotebookCard";
import { openNotebookModal } from "@/components/app/NotebookReaderModal";
import { HublyNotebookIcon } from "@/components/app/icons/HublyIcons";
import { HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { useCreateNotebook } from "@/components/app/tasks/NotebooksSection";

function notebookStamp(index: number, updatedAt: string) {
  const date = new Date(updatedAt);
  const number = `N° ${String(index + 1).padStart(2, "0")}`;
  if (Number.isNaN(date.getTime())) return number;
  const month = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
  return `${number} · ${month} ${String(date.getFullYear()).slice(-2)}`;
}

/** Libretas Kraft de la agencia. */
export function LibretasWidget() {
  const createNotebook = useCreateNotebook();
  const notebooks = useHublyStore((s) => s.notebooks);

    return (
      <section
        key="libretas"
        data-widget-id="libretas"
        className="hb-widget"
      >
        <div className="hb-widget-head">
          <div className="hb-widget-title">
            <span className="hb-widget-icon-box">
              <HublyNotebookIcon size={18} />
            </span>
            <span>Libretas</span>
            <span className="hb-widget-badge">{notebooks.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={createNotebook}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                color: "var(--ui-text-3)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Plus className="w-3 h-3" />
              <span>Nota</span>
            </button>
          </div>
        </div>

        <div className="hb-widget-body hb-widget-body--tall" style={{ padding: "18px 20px" }}>
          <div className="hubly-shelf">
            {notebooks.map((nb) => (
              <KraftNotebookCard
                key={nb.id}
                title={nb.title}
                stamp={nb.stamp || notebookStamp(notebooks.indexOf(nb), nb.updatedAt)}
                variant={nb.variant}
                subtitle={nb.subtitle}
                category={nb.category}
                isPinned={nb.isPinned}
                accentColor={nb.accentColor}
                onClick={() => openNotebookModal(nb.id)}
              />
            ))}
          </div>
          <div className="hb-widget-footer">
            <Link href="/libretas" className="hb-widget-link">
              Ver libretas →
            </Link>
          </div>
        </div>
      </section>
    );
}
