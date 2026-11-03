"use client";

import { useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import type { PostStatus, SocialNetwork, SocialPost } from "@/lib/types";
import { STATUS_META } from "./status-meta";

const DROP_COLUMNS: PostStatus[] = ["draft", "pending", "changes", "approved", "scheduled"];

/** «Publicado» solo se muestra: lo decide la publicación real, no un arrastre. */
export function ProductionBoard({ posts }: { posts: SocialPost[] }) {
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const openComposer = useHublyStore((s) => s.openComposer);
  const profileName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const [network, setNetwork] = useState<SocialNetwork | "todas">("todas");

  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns: DROP_COLUMNS,
    onMove: (id, toCol) => {
      const current = posts.find((p) => p.id === id);
      if (current && current.status !== toCol) {
        updatePostStatus(id, toCol as PostStatus, undefined, profileName, "agency");
      }
    },
  });

  const networks = Array.from(new Set(posts.flatMap((p) => p.networks)));
  const visible = network === "todas" ? posts : posts.filter((p) => p.networks.includes(network));
  const published = visible.filter((p) => p.status === "published");

  const renderCard = (post: SocialPost, draggable: boolean) => (
    <div
      key={post.id}
      {...(draggable ? getCardProps(post.id) : {})}
      onClick={() => openComposer(post.id)}
      style={{
        background: "var(--ui-surface)",
        border: "1px solid var(--ui-border)",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: draggable ? (drag?.id === post.id ? "grabbing" : "grab") : "pointer",
        opacity: drag?.id === post.id ? 0.35 : 1,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ui-text)", marginBottom: 4 }}>{post.title}</div>
      <div style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>
        {post.scheduledDate} · {post.networks.join(", ")}
      </div>
    </div>
  );

  const renderColumn = (status: PostStatus, items: SocialPost[], droppable: boolean) => (
    <div
      key={status}
      {...(droppable ? getColumnProps(status) : {})}
      style={{
        background: drag?.overCol === status ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
        border: `1px solid ${drag?.overCol === status ? "var(--hb-accent)" : "var(--ui-border)"}`,
        borderRadius: 14,
        padding: 12,
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: STATUS_META[status].color }}>
          {STATUS_META[status].label}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ui-text-3)" }}>{items.length}</span>
      </div>
      {items.map((p) => renderCard(p, droppable))}
    </div>
  );

  return (
    <div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ui-text-3)", marginBottom: 12 }}>
        Red
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as SocialNetwork | "todas")}
          style={{ border: "1px solid var(--ui-border-strong)", borderRadius: 8, padding: "5px 8px", fontSize: 12.5, background: "var(--ui-surface)" }}
        >
          <option value="todas">Todas</option>
          {networks.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(190px, 1fr))", gap: 12 }}>
          {DROP_COLUMNS.map((status) => renderColumn(status, visible.filter((p) => p.status === status), true))}
          {renderColumn("published", published, false)}
        </div>
      </div>
    </div>
  );
}
