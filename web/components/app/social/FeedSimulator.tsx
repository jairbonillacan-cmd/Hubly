"use client";

import { postThumbnail } from "@/lib/post-draft";
import { useMemo } from "react";
import { Cover } from "@/components/Cover";
import { useHublyStore } from "@/lib/store";
import { publishing } from "@/lib/publishing/gateway";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import type { SocialPost } from "@/lib/types";

/** Vista previa del perfil de Instagram. Arrastrar intercambia las fechas de los dos posts. */
export function FeedSimulator({ posts }: { posts: SocialPost[] }) {
  const movePost = publishing.reschedule;
  const openComposer = useHublyStore((s) => s.openComposer);

  const feed = useMemo(
    () =>
      posts
        .filter((p) => p.networks.includes("Instagram"))
        .sort((a, b) => `${b.scheduledDate}${b.scheduledTime}`.localeCompare(`${a.scheduledDate}${a.scheduledTime}`)),
    [posts]
  );
  const columns = useMemo(() => feed.map((p) => p.id), [feed]);
  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns,
    onMove: (id, toCol) => {
      if (id === toCol) return;
      const a = feed.find((p) => p.id === id);
      const b = feed.find((p) => p.id === toCol);
      if (!a || !b) return;
      movePost(a.id, b.scheduledDate);
      movePost(b.id, a.scheduledDate);
    },
  });

  if (feed.length === 0) {
    return <p style={{ fontSize: 13.5, color: "var(--ui-text-4)", textAlign: "center", padding: 32 }}>Aún no hay posts para Instagram en esta marca.</p>;
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: "0 0 10px", textAlign: "center" }}>
        Así se verá el perfil, de lo más reciente a lo más antiguo. Arrastra un post sobre otro para intercambiar sus fechas.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 3 }}>
        {feed.map((post) => (
          <div
            key={post.id}
            {...getColumnProps(post.id)}
            style={{ aspectRatio: "4 / 5", overflow: "hidden", outline: drag?.overCol === post.id && drag.id !== post.id ? "3px solid var(--hb-accent)" : undefined, outlineOffset: -3 }}
          >
            <div
              {...getCardProps(post.id)}
              onClick={() => openComposer(post.id)}
              title={`${post.title} · ${post.scheduledDate}`}
              aria-label={`${post.title}, ${post.scheduledDate}`}
              style={{ position: "relative", width: "100%", height: "100%", cursor: drag?.id === post.id ? "grabbing" : "grab", opacity: drag?.id === post.id ? 0.35 : 1 }}
            >
              {postThumbnail(post)?.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={postThumbnail(post)?.url} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <Cover kind={post.cover} />
              )}
              <span style={{ position: "absolute", left: 4, bottom: 4, fontSize: 10.5, fontWeight: 600, color: "#FFFFFF", background: "rgba(15,23,42,0.7)", borderRadius: 5, padding: "1px 5px" }}>
                {post.scheduledDate.slice(5)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
