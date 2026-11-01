"use client";

import Link from "next/link";
import { KraftNotebookCard } from "@/components/app/KraftNotebookCard";
import { HublyNotebookIcon, } from "@/components/app/icons/HublyIcons";
import {
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";
import { notebookStamp } from "./inicioView-shared";
import type { InicioViewModel } from "./useInicioView";

export function WidgetLibretas({ view }: { view: InicioViewModel }) {
  const { notebooks, setActiveNotebookId, setIsCreatingNotebook, setNbTitle, setNbSubtitle, setNbCategory, setNbContent } = view;
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
            onClick={() => {
              setActiveNotebookId(null);
              setIsCreatingNotebook(true);
              setNbTitle("");
              setNbSubtitle("");
              setNbCategory("Idea");
              setNbContent("");
            }}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 999,
              border: "1px solid rgba(226, 232, 240, 0.95)",
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
              onClick={() => {
                setIsCreatingNotebook(false);
                setActiveNotebookId(nb.id);
              }}
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
