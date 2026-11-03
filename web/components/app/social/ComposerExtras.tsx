"use client";

import { useState } from "react";
import { localIsoDate } from "@/lib/date";
import { useHublyStore } from "@/lib/store";
import { publishing } from "@/lib/publishing/gateway";
import type { BrandWorkspace, PostFormat, SocialNetwork, SocialPost } from "@/lib/types";
import { STATUS_META } from "./status-meta";
import {
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

const FIELDS = [
  ["reach", "Alcance"],
  ["likes", "Me gusta"],
  ["comments", "Comentarios"],
  ["saves", "Guardados"],
  ["shares", "Compartidos"],
] as const;
type MetricKey = (typeof FIELDS)[number][0];

const AI_ERRORS: Record<string, string> = {
  ai_not_configured: "La IA no está configurada todavía.",
  forbidden: "Tu rol no permite usar la IA.",
  rate_limited: "Demasiadas solicitudes. Inténtalo en un momento.",
  refused: "La IA no quiso redactar esa indicación. Prueba a reformularla.",
  brief_too_long: "La indicación es demasiado larga.",
};

/** Mientras no haya conexión con redes, la publicación y sus resultados se registran a mano. */
export function ManualResults({ post }: { post: SocialPost }) {
  const recordPublication = publishing.markPublished;
  const setPostResults = useHublyStore((s) => s.setPostResults);
  const [url, setUrl] = useState(post.publishedUrl || "");
  const [date, setDate] = useState(post.status === "published" ? post.scheduledDate : localIsoDate());
  const [values, setValues] = useState<Record<MetricKey, string>>(() => ({
    reach: String(post.metrics?.reach ?? ""),
    likes: String(post.metrics?.likes ?? ""),
    comments: String(post.metrics?.comments ?? ""),
    saves: String(post.metrics?.saves ?? ""),
    shares: String(post.metrics?.shares ?? ""),
  }));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const published = post.status === "published";
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
            setError("El enlace debe empezar con http:// o https://");
            return;
          }
          setError(null);
          recordPublication(post.id, { url: url.trim(), date });
          setSaved("Publicación registrada.");
        }}
        style={box}
      >
        <strong style={{ fontSize: 13.5 }}>{published ? "Publicado" : "¿Ya lo publicaste en la red?"}</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-label="Fecha de publicación" style={field} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace al post (opcional)" aria-label="Enlace al post" style={{ ...field, flex: "1 1 200px" }} />
          <button type="submit" className="hbtn hbtn-secondary hbtn-sm">{published ? "Actualizar" : "Marcar como publicado"}</button>
        </div>
        {post.publishedUrl && (
          <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--ui-accent-text-2)", fontWeight: 600 }}>Abrir publicación</a>
        )}
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = (k: MetricKey) => Math.max(0, Math.round(Number(values[k]) || 0));
          setPostResults(post.id, { reach: n("reach"), likes: n("likes"), comments: n("comments"), saves: n("saves"), shares: n("shares") });
          setSaved("Resultados guardados.");
        }}
        style={box}
      >
        <strong style={{ fontSize: 13.5 }}>Resultados</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
          {FIELDS.map(([key, label]) => (
            <label key={key} style={{ display: "grid", gap: 3, fontSize: 12, fontWeight: 600, color: "var(--ui-text-3)" }}>
              {label}
              <input type="number" min={0} value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} style={field} />
            </label>
          ))}
        </div>
        <div>
          <button type="submit" disabled={!published} title={published ? undefined : "Primero marca el post como publicado"} className="hbtn hbtn-secondary hbtn-sm">Guardar resultados</button>
        </div>
      </form>
      {error && <p role="alert" style={{ color: STATUS_META.changes.color, fontSize: 13, margin: 0 }}>{error}</p>}
      {saved && <p role="status" style={{ color: "var(--ui-positive-text)", fontSize: 13, margin: 0 }}>{saved}</p>}
    </div>
  );
}

export function CaptionAssistant({
  brand,
  network,
  format,
  onUse,
}: {
  brand?: BrandWorkspace;
  network: SocialNetwork;
  format: PostFormat;
  onUse: (caption: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="hbtn hbtn-ghost hbtn-sm" style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Sparkles size={14} /> Redactar con IA
      </button>
    );
  }

  const generate = async () => {
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          network,
          format,
          brand: brand && {
            name: brand.name,
            whatTheySell: brand.core?.whatTheySell,
            toneOfVoice: brand.core?.toneOfVoice,
            pillars: brand.core?.pillars,
            doWords: brand.core?.doWords,
            dontWords: brand.core?.dontWords,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { caption?: string; error?: string };
      if (json.caption) setDraft(json.caption);
      else setError(AI_ERRORS[json.error || ""] || "No se pudo redactar. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo redactar. Revisa tu conexión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={box}>
      <label style={{ display: "grid", gap: 4, fontSize: 12.5, fontWeight: 600, color: "var(--ui-text-3)" }}>
        ¿Qué quieres comunicar?
        <textarea rows={2} maxLength={2000} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Ej. Abrimos sucursal nueva el sábado" style={{ ...field, resize: "vertical" }} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={busy || !brief.trim()} onClick={generate} className="hbtn hbtn-secondary hbtn-sm">{busy ? "Redactando…" : "Redactar"}</button>
        <button type="button" onClick={() => setOpen(false)} className="hbtn hbtn-ghost hbtn-sm">Cerrar</button>
      </div>
      {error && <p role="alert" style={{ color: STATUS_META.changes.color, fontSize: 13, margin: 0 }}>{error}</p>}
      {draft && (
        <>
          <p style={{ margin: 0, fontSize: 13, whiteSpace: "pre-line", color: "var(--ui-text-1)" }}>{draft}</p>
          <div>
            <button
              type="button"
              className="hbtn hbtn-primary hbtn-sm"
              onClick={() => {
                onUse(draft);
                setDraft(null);
                setOpen(false);
              }}
            >
              Usar este texto
            </button>
          </div>
          <small style={{ color: "var(--ui-text-4)" }}>Generado con IA: revísalo antes de publicar.</small>
        </>
      )}
    </div>
  );
}

const box = { display: "grid", gap: 10, border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12 } as const;
const field = { border: "1px solid var(--ui-border-strong)", borderRadius: 8, padding: "6px 8px", fontSize: 13, background: "var(--ui-surface)", color: "var(--ui-text)", fontFamily: "inherit", minWidth: 0 } as const;
