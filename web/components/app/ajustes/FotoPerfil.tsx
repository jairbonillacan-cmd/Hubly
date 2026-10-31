"use client";

import { useRef, useState } from "react";
import { HublyCameraIcon, HublyMinusIcon, HublyPlusIcon, HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";
import { backendEnabled } from "@/lib/supabase/config";
import { useHublyStore } from "@/lib/store";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";
import { AjustesModal } from "./Panel";

const STAGE = 280;
const OUT = 256;
const SOURCE_MAX = 1024;
const MAX_BYTES = 5 * 1024 * 1024;

/** Reduce el original a 1024px para poder reencuadrar sin guardar fotos enormes. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const k = Math.min(1, SOURCE_MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * k);
        canvas.height = Math.round(img.naturalHeight * k);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface Pose { zoom: number; x: number; y: number }

function Reencuadre({ src, onCancel, onSave }: { src: string; onCancel: () => void; onSave: (cropped: string) => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [pose, setPose] = useState<Pose>({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const base = size ? STAGE / Math.min(size.w, size.h) : 1;
  const clamp = (p: Pose): Pose => {
    if (!size) return p;
    const zoom = Math.min(4, Math.max(1, p.zoom));
    return {
      zoom,
      x: Math.min(0, Math.max(STAGE - size.w * base * zoom, p.x)),
      y: Math.min(0, Math.max(STAGE - size.h * base * zoom, p.y)),
    };
  };
  const zoomTo = (next: number) =>
    setPose((p) => {
      const zoom = Math.min(4, Math.max(1, next));
      const r = zoom / p.zoom;
      const c = STAGE / 2;
      return clamp({ zoom, x: c - (c - p.x) * r, y: c - (c - p.y) * r });
    });
  const move = (dx: number, dy: number) => setPose((p) => clamp({ ...p, x: p.x + dx, y: p.y + dy }));

  const save = () => {
    if (!size || !imgRef.current) return;
    const scale = base * pose.zoom;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, -pose.x / scale, -pose.y / scale, STAGE / scale, STAGE / scale, 0, 0, OUT, OUT);
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <AjustesModal open title="Ajustar foto" submitDisabled={!size} onClose={onCancel} onSubmit={save}>
      <div
        className="hubly-ajustes-stage"
        tabIndex={0}
        role="group"
        aria-label="Encuadre de la foto. Arrastra o usa las flechas para moverla"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          move(e.clientX - drag.current.x, e.clientY - drag.current.y);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onKeyDown={(e) => {
          const step = 10;
          const delta: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
          const d = delta[e.key];
          if (!d) return;
          e.preventDefault();
          move(d[0], d[1]);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const w = e.currentTarget.naturalWidth;
            const h = e.currentTarget.naturalHeight;
            const s = STAGE / Math.min(w, h);
            setSize({ w, h });
            setPose({ zoom: 1, x: (STAGE - w * s) / 2, y: (STAGE - h * s) / 2 });
          }}
          style={{ width: size ? size.w * base * pose.zoom : undefined, height: size ? size.h * base * pose.zoom : undefined, transform: `translate(${pose.x}px, ${pose.y}px)`, opacity: size ? 1 : 0 }}
        />
        <div className="hubly-ajustes-stage-mask" />
      </div>
      <div className="hubly-ajustes-zoom">
        <button type="button" className="hbtn hbtn-ghost hbtn-sm hbtn-ic" aria-label="Alejar" onClick={() => zoomTo(pose.zoom - 0.25)}><HublyMinusIcon size={15} /></button>
        <input type="range" min={1} max={4} step={0.01} value={pose.zoom} aria-label="Zoom" onChange={(e) => zoomTo(Number(e.target.value))} />
        <button type="button" className="hbtn hbtn-ghost hbtn-sm hbtn-ic" aria-label="Acercar" onClick={() => zoomTo(pose.zoom + 0.25)}><HublyPlusIcon size={15} /></button>
      </div>
    </AjustesModal>
  );
}

function Visor({ open, src, canAdjust, onClose, onAdjust, onChange, onRemove }: { open: boolean; src: string; canAdjust: boolean; onClose: () => void; onAdjust: () => void; onChange: () => void; onRemove: () => void }) {
  const presence = useModalPresence(open);
  useLayer(open, onClose);
  if (!presence.mounted) return null;
  return (
    <div className="hubly-overlay hubly-cal-overlay" data-state={presence.state} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hubly-ajustes-viewer" role="dialog" aria-modal="true" aria-label="Foto de perfil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Foto de perfil" />
        <div className="hubly-ajustes-viewer-actions">
          {canAdjust && <button type="button" className="hbtn hbtn-secondary" onClick={onAdjust}>Ajustar encuadre</button>}
          <button type="button" className="hbtn hbtn-primary" onClick={onChange}>Cambiar foto</button>
          <button type="button" className="hbtn hbtn-secondary" onClick={onRemove}>Quitar foto</button>
          <button type="button" className="hbtn hbtn-ghost hbtn-ic" aria-label="Cerrar" onClick={onClose}><HublyCloseIcon size={15} /></button>
        </div>
      </div>
    </div>
  );
}

/** Foto de perfil: abrir, cambiar y reencuadrar. Con cuentas reales aún no hay dónde guardarla. */
export function FotoPerfil() {
  const profile = useHublyStore((s) => s.profile);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState(false);
  const [crop, setCrop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = () => { setError(null); fileRef.current?.click(); };
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Elige una imagen JPG, PNG, WebP o GIF.");
    if (file.size > MAX_BYTES) return setError("La imagen pesa más de 5 MB. Prueba con una más ligera.");
    try {
      setViewer(false);
      setCrop(await readImage(file));
    } catch {
      setError("No pudimos leer esa imagen. Prueba con otra.");
    }
  };

  const photo = profile?.avatarUrl;
  const editable = !backendEnabled;

  return (
    <>
      <div className="hubly-ajustes-profile">
        <button
          type="button"
          className="hubly-ajustes-avatar"
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
          disabled={!editable}
          aria-label={photo ? "Ver foto de perfil" : "Agregar foto de perfil"}
          onClick={() => (photo ? setViewer(true) : pick())}
        >
          {photo ? null : profile?.avatarInitial}
        </button>
        <div>
          <div className="hubly-ajustes-name">{profile?.name}</div>
          <div className="hubly-ajustes-email">{profile?.email}</div>
          <div style={{ marginTop: 6 }}><span className="hubly-ajustes-tag">{profile?.role || "Miembro"}</span></div>
          <button type="button" className="hubly-ajustes-link" style={{ marginTop: 8 }} disabled={!editable} data-planned={editable ? undefined : ""} title={editable ? undefined : "Función prevista con cuentas reales"} onClick={pick}>
            <HublyCameraIcon size={15} /> Cambiar foto
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p role="alert" className="hubly-ajustes-hint">{error}</p>}
      {!editable && <p className="hubly-ajustes-hint">Con cuentas reales la foto es una función prevista.</p>}
      <Visor
        open={viewer && Boolean(photo)}
        src={profile?.avatarSourceUrl || photo || ""}
        canAdjust={Boolean(profile?.avatarSourceUrl)}
        onClose={() => setViewer(false)}
        onAdjust={() => { setViewer(false); setCrop(profile?.avatarSourceUrl || null); }}
        onChange={() => { setViewer(false); pick(); }}
        onRemove={() => { setViewer(false); updateProfile({ avatarUrl: undefined, avatarSourceUrl: undefined }); }}
      />
      {crop && (
        <Reencuadre
          src={crop}
          onCancel={() => setCrop(null)}
          onSave={(cropped) => {
            updateProfile({ avatarUrl: cropped, avatarSourceUrl: crop });
            setCrop(null);
          }}
        />
      )}
    </>
  );
}
