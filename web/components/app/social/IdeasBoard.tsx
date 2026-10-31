"use client";

import { useState } from "react";
import { useHublyStore } from "@/lib/store";
import type { ContentIdea } from "@/lib/types";
import {
  HublyArrowRightIcon as ArrowRight,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

const NO_IDEAS: ContentIdea[] = [];

export function IdeasBoard({ brandId, brandName }: { brandId: string; brandName: string }) {
  const ideas = useHublyStore((s) => s.ideas) ?? NO_IDEAS;
  const addIdea = useHublyStore((s) => s.addIdea);
  const removeIdea = useHublyStore((s) => s.removeIdea);
  const convertIdeaToPost = useHublyStore((s) => s.convertIdeaToPost);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pillar, setPillar] = useState("");

  const brandIdeas = ideas.filter((i) => i.brandId === brandId);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addIdea({ brandId, title: title.trim(), notes: notes.trim(), pillar: pillar.trim() || "General" });
          setTitle("");
          setNotes("");
          setPillar("");
        }}
        style={{ ...card, display: "grid", gap: 10, marginBottom: 18 }}
      >
        <strong style={{ fontSize: 14 }}>Nueva idea para {brandName}</strong>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿De qué trata la idea?"
            aria-label="Título de la idea"
            required
            style={{ ...field, flex: "2 1 240px" }}
          />
          <input
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
            placeholder="Pilar (opcional)"
            aria-label="Pilar de contenido"
            style={{ ...field, flex: "1 1 140px" }}
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gancho, referencias o borrador del texto"
          aria-label="Notas de la idea"
          rows={2}
          style={{ ...field, resize: "vertical" }}
        />
        <button type="submit" style={{ ...primary, justifySelf: "start" }}>
          Guardar idea
        </button>
      </form>

      {brandIdeas.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--ui-text-4)", textAlign: "center", padding: 24 }}>
          Aún no hay ideas guardadas para esta marca.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
          {brandIdeas.map((idea) => (
            <article key={idea.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ui-accent-text)" }}>{idea.pillar}</span>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>{idea.title}</h3>
              {idea.notes && <p style={{ fontSize: 12.5, color: "var(--ui-text-3)", margin: 0, whiteSpace: "pre-line" }}>{idea.notes}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                <button type="button" onClick={() => convertIdeaToPost(idea.id)} style={{ ...primary, flex: 1 }}>
                  {idea.convertedPostId ? "Abrir post" : "Convertir en post"}
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar idea ${idea.title}`}
                  onClick={() => removeIdea(idea.id)}
                  style={{ border: "1px solid var(--ui-border-strong)", background: "var(--ui-surface)", color: "var(--ui-text-3)", borderRadius: 8, padding: "0 9px", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const card = { background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: 16 } as const;
const field = { border: "1px solid var(--ui-border-strong)", borderRadius: 9, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", minWidth: 0 } as const;
const primary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "none",
  borderRadius: 8,
  background: "var(--hb-accent)",
  color: "#FFFFFF",
  fontSize: 12.5,
  fontWeight: 600,
  padding: "8px 12px",
  cursor: "pointer",
} as const;
