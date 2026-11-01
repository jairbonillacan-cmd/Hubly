"use client";

import { Button } from "@/components/app/ui/Button";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { addCollaborators, bestHours, hourLabel, MAX_COLLABORATORS, nextWeekday, type StoryRepeat } from "@/lib/composer-rules";
import { localIsoDate } from "@/lib/date";
import { uploadMedia } from "@/lib/media-client";
import { useLayer } from "@/lib/use-layer";
import type { PlatformSettings, SocialNetwork, SocialPost, TeamMember } from "@/lib/types";
import { HublyCheckIcon, HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";

export function CollaboratorsField({ value, disabled, onChange, icon }: { value: string[]; disabled: boolean; onChange: (next: string[]) => void; icon: ReactNode }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const commit = (raw: string) => {
    if (!raw.trim()) return;
    const result = addCollaborators(raw, value);
    if (result.list.length !== value.length) onChange(result.list);
    setText("");
    setError(result.error);
  };
  return (
    <div className="hubly-composer-collabs">
      <label htmlFor="hubly-collab-input">{icon} Colaboradores de Instagram <small>{value.length}/{MAX_COLLABORATORS}</small></label>
      <div className="hubly-composer-collabfield">
        {value.map((handle) => (
          <span key={handle}>
            @{handle}
            {!disabled && <button type="button" aria-label={`Quitar a @${handle}`} onClick={() => { onChange(value.filter((c) => c !== handle)); setError(null); }}><HublyCloseIcon size={12} /></button>}
          </span>
        ))}
        {value.length < MAX_COLLABORATORS && (
          <input
            id="hubly-collab-input"
            value={text}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            placeholder={value.length === 0 ? "Agregar @usuario" : "Otro @usuario"}
            onChange={(e) => { setText(e.target.value); if (error) setError(null); }}
            onBlur={() => commit(text)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (/[\s,]/.test(pasted) || /instagram\.com/i.test(pasted)) {
                e.preventDefault();
                commit(pasted);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commit(text);
              } else if (e.key === "Backspace" && !text && value.length > 0) {
                onChange(value.slice(0, -1));
              }
            }}
          />
        )}
      </div>
      {error ? <small role="alert" className="hubly-composer-fielderror">{error}</small> : <small className="hubly-composer-hint">Aparece como publicación en colaboración. Cada cuenta recibe una invitación que debe aceptar y debe ser pública, de empresa o creador.</small>}
    </div>
  );
}

const PRIVACY: { id: NonNullable<PlatformSettings["tiktokPrivacy"]>; label: string }[] = [
  { id: "PUBLIC_TO_EVERYONE", label: "Todos" },
  { id: "MUTUAL_FOLLOW_FRIENDS", label: "Amigos (seguidores mutuos)" },
  { id: "FOLLOWER_OF_CREATOR", label: "Seguidores" },
  { id: "SELF_ONLY", label: "Solo yo (privado)" },
];

export function TikTokSettings({ settings, isVideo, disabled, onChange }: { settings: PlatformSettings; isVideo: boolean; disabled: boolean; onChange: (patch: Partial<PlatformSettings>) => void }) {
  const toggle = (key: keyof PlatformSettings, label: string, hint?: string, on?: boolean, extra?: boolean) => (
    <label key={key} className="hubly-composer-check">
      <input type="checkbox" disabled={disabled || extra} checked={on ?? settings[key] === true} onChange={(e) => onChange({ [key]: e.target.checked })} />
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
    </label>
  );
  const label = settings.brandContent ? "Colaboración pagada" : settings.brandOrganic ? "Contenido promocional" : null;
  return (
    <div className="hubly-composer-netbox">
      <small>TikTok · ajustes del post</small>
      <label className="hubly-composer-stack">
        Quién puede ver este post
        <select className="hubly-cal-input" disabled={disabled} value={settings.tiktokPrivacy ?? "PUBLIC_TO_EVERYONE"} onChange={(e) => onChange({ tiktokPrivacy: e.target.value as PlatformSettings["tiktokPrivacy"] })}>
          {PRIVACY.map((p) => <option key={p.id} value={p.id} disabled={p.id === "SELF_ONLY" && settings.brandContent}>{p.label}</option>)}
        </select>
      </label>
      {toggle("allowComment", "Permitir comentarios", undefined, settings.allowComment !== false)}
      {isVideo && toggle("allowDuet", "Permitir Duet", undefined, settings.allowDuet !== false)}
      {isVideo && toggle("allowStitch", "Permitir Stitch", undefined, settings.allowStitch !== false)}
      <label className="hubly-composer-check">
        <input
          type="checkbox"
          disabled={disabled}
          checked={settings.commercial === true}
          onChange={(e) => onChange(e.target.checked ? { commercial: true } : { commercial: undefined, brandOrganic: undefined, brandContent: undefined })}
        />
        <span><strong>Divulgar contenido comercial</strong></span>
      </label>
      {settings.commercial && (
        <div className="hubly-composer-indent">
          {toggle("brandOrganic", "Tu marca", "Promocionas tu propio negocio o marca.")}
          {toggle("brandContent", "Contenido de marca", "Promocionas a un tercero en una colaboración pagada.", undefined, settings.tiktokPrivacy === "SELF_ONLY")}
          <small className="hubly-composer-hint">{label ? `Se etiquetará como «${label}».` : "Indica si tu contenido te promociona a ti, a un tercero o a ambos."}</small>
        </div>
      )}
      {toggle("aiGenerated", "Contenido generado con IA", "TikTok le pone la etiqueta de contenido creado con IA.")}
      {!isVideo && (
        <label className="hubly-composer-stack">
          Título del post de fotos · {(settings.title ?? "").length}/90
          <input className="hubly-cal-input" disabled={disabled} maxLength={90} value={settings.title ?? ""} placeholder="Si lo dejas vacío, se usa la primera línea del texto" onChange={(e) => onChange({ title: e.target.value || undefined })} />
        </label>
      )}
      <small className="hubly-composer-hint">Estos ajustes se guardan para aplicarlos al publicar en TikTok.</small>
    </div>
  );
}

const DAYS = [{ l: "L", v: 1, n: "lunes" }, { l: "M", v: 2, n: "martes" }, { l: "M", v: 3, n: "miércoles" }, { l: "J", v: 4, n: "jueves" }, { l: "V", v: 5, n: "viernes" }, { l: "S", v: 6, n: "sábado" }, { l: "D", v: 0, n: "domingo" }];

export function StoryRepeatField({ value, time, disabled, onChange }: { value: StoryRepeat | null | undefined; time: string; disabled: boolean; onChange: (next: StoryRepeat | null) => void }) {
  const on = Boolean(value);
  const days = value?.days ?? [];
  return (
    <div className="hubly-composer-repeat">
      <label className="hubly-composer-check">
        <input type="checkbox" disabled={disabled} checked={on} onChange={(e) => onChange(e.target.checked ? { days: [] } : null)} />
        <span><strong>Repetir esta story</strong></span>
      </label>
      {value && (
        <div className="hubly-composer-indent">
          <div className="hubly-composer-days" role="group" aria-label="Días en que se repite">
            {DAYS.map((d) => (
              <button key={d.v} type="button" aria-label={d.n} aria-pressed={days.includes(d.v)} disabled={disabled} onClick={() => onChange({ ...value, days: days.includes(d.v) ? days.filter((x) => x !== d.v) : [...days, d.v] })}>{d.l}</button>
            ))}
          </div>
          <small className="hubly-composer-hint">{days.length === 0 ? "Elige los días en que se publicará." : time ? `Siempre a las ${time}. Crea hasta 12 posts al programar.` : "Elige la hora arriba."}</small>
          <div className="hubly-composer-repeatend">
            <span>Termina</span>
            <button type="button" className="hubly-cal-pill" disabled={disabled} aria-pressed={!value.endDate} onClick={() => onChange({ days })}>Nunca</button>
            <label>
              Hasta
              <input className="hubly-cal-input" type="date" disabled={disabled} min={localIsoDate()} value={value.endDate ?? ""} onChange={(e) => onChange({ days, endDate: e.target.value || undefined })} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function BestHours({ posts, date, onPick }: { posts: SocialPost[]; date: string; onPick: (date: string, time: string) => void }) {
  const hours = bestHours(posts);
  if (hours.length === 0) return null;
  return (
    <div className="hubly-composer-besthours">
      <span>Te ha ido mejor:</span>
      {hours.map((h) => (
        <button
          key={`${h.day}-${h.hour}`}
          type="button"
          className="hubly-cal-pill"
          title={`${h.average.toLocaleString("es-MX")} de alcance promedio en ${h.pieces} ${h.pieces === 1 ? "publicación" : "publicaciones"}`}
          onClick={() => onPick(nextWeekday(date || localIsoDate(), h.day), `${String(h.hour).padStart(2, "0")}:00`)}
        >
          {h.dayName} {hourLabel(h.hour)}
        </button>
      ))}
    </div>
  );
}

export function TikTokFitHint({ url }: { url?: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const image = new window.Image();
    image.onload = () => { if (alive && image.naturalHeight) setRatio(image.naturalWidth / image.naturalHeight); };
    image.src = url;
    return () => { alive = false; };
  }, [url]);
  const fits = ratio !== null && ratio >= (9 / 16) * 0.97 && ratio <= (9 / 16) * 1.03;
  if (!url || ratio === null || fits) return null;
  return <small className="hubly-composer-hint">Para que llene toda la pantalla en TikTok: 1080×1920.</small>;
}

/** Duración de un video, o null si el navegador no logra leerla. */
export function videoDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const timer = setTimeout(() => resolve(null), 5000);
    video.preload = "metadata";
    video.onloadedmetadata = () => { clearTimeout(timer); resolve(Number.isFinite(video.duration) ? video.duration : null); };
    video.onerror = () => { clearTimeout(timer); resolve(null); };
    video.src = url;
  });
}

export function ConfirmPublish({
  intent,
  when,
  networks,
  noCopy,
  repeats,
  renderIcon,
  onCancel,
  onConfirm,
}: {
  intent: "programar" | "publicar";
  when: string | null;
  networks: SocialNetwork[];
  noCopy: boolean;
  repeats: number;
  renderIcon: (network: SocialNetwork) => ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useLayer(true, onCancel);
  const programar = intent === "programar";
  return (
    <div className="hubly-picker-scrim">
      <div className="hubly-composer-pending hubly-composer-confirm" role="alertdialog" aria-modal="true" aria-labelledby="hubly-confirm-title">
        <h2 id="hubly-confirm-title">{programar ? "Confirmar programación" : "¿Ya lo subiste a la red?"}</h2>
        <p>{programar ? "Revisa dónde y cuándo va a salir." : "Hubly lo registra como publicado y ya no se puede programar."}</p>
        {programar && (
          <dl>
            <dt>Queda en tu calendario el</dt>
            <dd>{when}{repeats > 0 ? `, y se repite ${repeats} ${repeats === 1 ? "vez" : "veces"} más` : ""}</dd>
          </dl>
        )}
        {noCopy && (
          <section className="hubly-composer-nocopy">
            <strong>Este post no tiene copy</strong>
            <span>{programar ? "Si nadie le escribe el copy antes de su hora, sale sin texto." : "Queda registrado sin texto. Si lleva caption, cancela y escríbelo primero."}</span>
          </section>
        )}
        <strong className="hubly-composer-confirmlabel">{programar ? "Vas a programar en" : "Vas a marcarlo en"}</strong>
        <ul>
          {networks.map((n) => <li key={n}><i>{renderIcon(n)}</i>{n}</li>)}
        </ul>
        {programar && <small className="hubly-composer-hint">Hubly aún no publica solo: a esa hora te toca subirlo a la red.</small>}
        <div>
          <Button autoFocus variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirm}>{programar ? "Confirmar y programar" : "Sí, marcar como publicado"}</Button>
        </div>
      </div>
    </div>
  );
}

/** Portada de un video: un cuadro del propio video o una imagen subida. */
export function CoverPicker({ videoUrl, brandId, onCancel, onSaved }: { videoUrl: string; brandId: string; onCancel: () => void; onSaved: (assetId: string) => void }) {
  useLayer(true, onCancel);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const record = await uploadMedia(file, { brandId, folder: "" }, () => {}).promise;
      onSaved(record.id);
    } catch {
      setError("No pudimos subir la portada. Revisa tu conexión e inténtalo otra vez.");
      setBusy(false);
    }
  };
  const useFrame = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) void upload(new File([blob], `portada-${Math.round(time)}s.jpg`, { type: "image/jpeg" }));
      else setError("No pudimos sacar ese cuadro. Prueba subiendo una imagen.");
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="hubly-picker-scrim">
      <div className="hubly-composer-pending hubly-composer-coverpick" role="dialog" aria-modal="true" aria-labelledby="hubly-cover-title">
        <h2 id="hubly-cover-title">Elegir portada</h2>
        <p>Mueve la barra para elegir el cuadro, o sube tu propia imagen.</p>
        <video ref={videoRef} src={videoUrl} muted playsInline preload="auto" onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            // Algunos WebM no declaran duración: buscar el final obliga al navegador a calcularla.
            if (Number.isFinite(video.duration)) setDuration(video.duration);
            else video.currentTime = 1e7;
          }}
          onDurationChange={(e) => {
            const video = e.currentTarget;
            if (!Number.isFinite(video.duration) || duration > 0) return;
            setDuration(video.duration);
            video.currentTime = 0;
          }} aria-label="Vista del cuadro elegido" />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.033}
          value={time}
          aria-label="Cuadro del video"
          onChange={(e) => {
            const next = Number(e.target.value);
            setTime(next);
            if (videoRef.current) videoRef.current.currentTime = next;
          }}
        />
        {error && <small role="alert" className="hubly-composer-fielderror">{error}</small>}
        <input ref={fileRef} type="file" accept="image/*" hidden aria-label="Subir imagen de portada" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        <div>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>Subir imagen</Button>
          <Button variant="primary" disabled={busy || !duration} onClick={useFrame}>{busy ? "Guardando…" : "Usar este cuadro"}</Button>
        </div>
      </div>
    </div>
  );
}

/** Menú de personas con búsqueda: responsables y «Avisar al publicar». */
export function PeopleMenu({ label, note, team, selected, photoFor, onToggle, clearLabel, onClear }: { label: string; note?: string; team: TeamMember[]; selected: string[]; photoFor: (member: TeamMember) => string | undefined; onToggle: (id: string) => void; clearLabel?: string; onClear?: () => void }) {
  const [search, setSearch] = useState("");
  const matches = team.filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <div className="hubly-composer-menu is-people" role="group" aria-label={label}>
      <input className="hubly-cal-input" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" aria-label="Buscar miembro" />
      {note && <small role="note">{note}</small>}
      {team.length === 0 && <small>Aún no hay miembros en el equipo.</small>}
      {team.length > 0 && matches.length === 0 && <small>Sin resultados</small>}
      {matches.map((member) => {
        const on = selected.includes(member.id);
        const photo = photoFor(member);
        return (
          <button key={member.id} type="button" aria-pressed={on} onClick={() => onToggle(member.id)}>
            <span className="hubly-composer-avatar" style={{ background: member.avatarColor || "var(--hb-accent)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo ? <img src={photo} alt="" /> : member.initials}
            </span>
            <span className="hubly-composer-person">{member.name}</span>
            {on && <HublyCheckIcon size={14} />}
          </button>
        );
      })}
      {clearLabel && onClear && selected.length > 0 && (
        <button type="button" className="is-clear" onClick={onClear}>{clearLabel}</button>
      )}
    </div>
  );
}
