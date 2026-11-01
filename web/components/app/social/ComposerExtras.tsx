"use client";

import React, { useState } from "react";
import { localIsoDate } from "@/lib/date";
import { safeLinkHref } from "@/lib/supabase/config";
import { useHublyStore } from "@/lib/store";
import type { BrandWorkspace, PostFormat, SocialNetwork, SocialPost } from "@/lib/types";
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
  const recordPublication = useHublyStore((s) => s.recordPublication);
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
        {safeLinkHref(post.publishedUrl) && (
          <a href={safeLinkHref(post.publishedUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--ui-accent-text-2)", fontWeight: 600 }}>Abrir publicación</a>
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
      {error && <p role="alert" style={{ color: "#B91C1C", fontSize: 13, margin: 0 }}>{error}</p>}
      {saved && <p role="status" style={{ color: "#15803D", fontSize: 13, margin: 0 }}>{saved}</p>}
    </div>
  );
}

/** Redacta con un clic a partir de lo que ya hay en el post. Nunca pisa un texto sin preguntar. */
export function CaptionAssistant({
  brand,
  network,
  format,
  title,
  current,
  disabled,
  counter,
  onUse,
}: {
  brand?: BrandWorkspace;
  network: SocialNetwork;
  format: PostFormat;
  title: string;
  current: string;
  disabled?: boolean;
  counter: React.ReactNode;
  onUse: (caption: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const brief =
      current.trim() ||
      title.trim() ||
      `Escribe un caption para un post de ${format} en ${network}${brand ? ` de la marca ${brand.name}` : ""}.`;
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
      if (json.caption) {
        if (current.trim()) setDraft(json.caption);
        else onUse(json.caption);
      } else setError(AI_ERRORS[json.error || ""] || "No pudimos generar el caption. Inténtalo otra vez.");
    } catch {
      setError("No pudimos generar el caption. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="hubly-composer-genrow">
        <button type="button" disabled={busy || disabled} onClick={generate} className="hbtn hbtn-gold hbtn-sm">
          <Sparkles size={15} /> {busy ? "Generando…" : "Generar caption"}
        </button>
        {counter}
      </div>
      {error && <p role="alert" className="hubly-composer-generror">{error}</p>}
      {draft && (
        <div className="hubly-composer-gendraft">
          <p>{draft}</p>
          <div>
            <button type="button" className="hbtn hbtn-secondary hbtn-sm" onClick={() => { onUse(draft); setDraft(null); }}>Reemplazar mi texto</button>
            <button type="button" className="hbtn hbtn-ghost hbtn-sm" onClick={() => setDraft(null)}>Descartar</button>
          </div>
          <small>Generado con IA: revísalo antes de publicar.</small>
        </div>
      )}
    </>
  );
}

const box = { display: "grid", gap: 10, border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12 } as const;
const field = { border: "1px solid var(--ui-border-strong)", borderRadius: 8, padding: "6px 8px", fontSize: 13, background: "var(--ui-surface)", color: "var(--ui-text)", fontFamily: "inherit", minWidth: 0 } as const;
