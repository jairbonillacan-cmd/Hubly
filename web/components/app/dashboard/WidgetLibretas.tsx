"use client";

import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { notebookStamp } from "@/lib/domain/dashboard";
import { KraftNotebookCard } from "@/components/app/KraftNotebookCard";
import { HublyNotebookIcon } from "@/components/app/icons/HublyIcons";
import { HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";
import { useCreateNotebook } from "@/components/app/use-create-notebook";

export function WidgetLibretas() {
  const notebooks = useHublyStore((s) => s.notebooks);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);
  const createNotebook = useCreateNotebook();

  return (
    <section key="libretas" data-widget-id="libretas" className="hb-widget">
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyNotebookIcon size={18} />
          </span>
          <span>Libretas</span>
          <span className="hb-widget-badge">{notebooks.length}</span>
        </div>
        <div className="hubly-dashboard-head-actions">
          <button
            type="button"
            onClick={createNotebook}
            className="hubly-dashboard-chip-btn"
          >
            <Plus className="w-3 h-3" />
            <span>Nota</span>
          </button>
        </div>
      </div>

      <div className="hb-widget-body hb-widget-body--tall hubly-dashboard-body-notebooks">
        <div className="hubly-shelf">
          {notebooks.map((nb, idx) => (
            <KraftNotebookCard
              key={nb.id}
              title={nb.title}
              stamp={nb.stamp || notebookStamp(idx, nb.updatedAt)}
              variant={nb.variant}
              subtitle={nb.subtitle}
              category={nb.category}
              isPinned={nb.isPinned}
              accentColor={nb.accentColor}
              onClick={() => setActiveNotebookId(nb.id)}
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
