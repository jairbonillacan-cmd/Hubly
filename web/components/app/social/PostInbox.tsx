"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import type { SocialPost } from "@/lib/types";

export function PostInbox({ posts }: { posts: SocialPost[] }) {
  const addPostComment = useHublyStore((s) => s.addPostComment);
  const openComposer = useHublyStore((s) => s.openComposer);
  const profileName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const threads = posts.filter((p) => p.comments.length > 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const selected = threads.find((t) => t.id === selectedId) || threads[0];

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "#64748B", margin: "0 0 12px" }}>
        Conversaciones sobre las publicaciones de esta marca. Los mensajes de cada red llegarán aquí cuando se conecten las cuentas.
      </p>
      {threads.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#64748B", textAlign: "center", padding: 36, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14 }}>
          Aún no hay comentarios. Aparecerán cuando el cliente revise un post desde su enlace.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, alignContent: "start", minWidth: 0 }}>
            {threads.map((t) => {
              const last = t.comments[t.comments.length - 1];
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-current={selected?.id === t.id ? "true" : undefined}
                    onClick={() => setSelectedId(t.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      font: "inherit",
                      background: selected?.id === t.id ? "#F0F1F9" : "#FFFFFF",
                      border: `1px solid ${selected?.id === t.id ? "#6C77C1" : "#E2E8F0"}`,
                      borderRadius: 12,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "#64748B", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {last.author}: {last.text}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <strong style={{ fontSize: 14 }}>{selected.title}</strong>
                <button type="button" onClick={() => openComposer(selected.id)} style={{ border: 0, background: "transparent", color: "#5A65AF", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Abrir post
                </button>
              </div>
              {selected.comments.map((c) => (
                <div key={c.id} style={{ alignSelf: c.role === "agency" ? "flex-end" : "flex-start", maxWidth: "85%", background: c.role === "agency" ? "#ECEEF8" : "#F1F5F9", borderRadius: 12, padding: "8px 11px", fontSize: 12.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{c.author}</div>
                  {c.text}
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addPostComment(selected.id, draft, profileName, "agency");
                  setDraft("");
                }}
                style={{ display: "flex", gap: 8, marginTop: 4 }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Responder…"
                  aria-label="Responder comentario"
                  style={{ flex: 1, minWidth: 0, border: "1px solid #CBD5E1", borderRadius: 9, padding: "8px 11px", fontSize: 13 }}
                />
                <button type="submit" aria-label="Enviar respuesta" style={{ border: "none", borderRadius: 9, background: "#6C77C1", color: "#FFFFFF", padding: "0 12px", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Send size={14} />
                </button>
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
