import { TikTokSettings, } from "@/components/app/social/ComposerPanels";
import { GLYPHS } from "@/components/previews/NetworkMarks";
import { type UploadHandle } from "@/lib/media-client";
import type { CustomFieldDefinition, PlatformSettings, PostFormat, PostStatus, SocialNetwork, } from "@/lib/types";
import {
  HublyChartIcon,
  HublyChatIcon,
  HublyClipboardIcon,
  HublyClockIcon,
  HublyDocumentIcon,
  HublyImageIcon,
  HublyMemoIcon,
  HublyPulseIcon,
  HublySaveIcon,
  HublySendIcon,
} from "@/components/app/icons/DuotoneIcons";

export interface PostComposerModalProps {
  open?: boolean;
  onClose?: () => void;
  initialPostId?: string | null;
  defaultBrandId?: string;
}

export type ComposerTab = "contenido" | "resultados" | "notas" | "todos" | "documentos" | "chat" | "actividad";

export const TABS: { id: ComposerTab; label: string; Icon: typeof HublyImageIcon }[] = [
  { id: "contenido", label: "Contenido", Icon: HublyImageIcon },
  { id: "resultados", label: "Resultados", Icon: HublyChartIcon },
  { id: "notas", label: "Notas", Icon: HublyMemoIcon },
  { id: "todos", label: "To-Dos", Icon: HublyClipboardIcon },
  { id: "documentos", label: "Documentos", Icon: HublyDocumentIcon },
  { id: "chat", label: "Chat", Icon: HublyChatIcon },
  { id: "actividad", label: "Actividad", Icon: HublyPulseIcon },
];

export { GLYPHS };

export const FORMAT_LABEL: Record<PostFormat, string> = { Imagen: "Imagen", Carrusel: "Carrusel", "Reel / Video": "Video", Story: "Story", Texto: "Solo texto" };

export type PublishMode = "guardar" | "programar" | "publicar";

export const PUBLISH_MODES: { id: PublishMode; label: string; Icon: typeof HublyImageIcon }[] = [
  { id: "guardar", label: "Solo guardar", Icon: HublySaveIcon },
  { id: "programar", label: "Programar", Icon: HublyClockIcon },
  { id: "publicar", label: "Publicar ya", Icon: HublySendIcon },
];

/** Las redes con marca negra se confundirían con el fondo en modo oscuro. */
export const networkInk = (color: string) => (color === "#000000" ? "var(--ui-text)" : color);

export const POST_COLORS = ["#16324F", "#2A76B0", "#0F766E", "#15803D", "#B45309", "#B91C1C", "#7C3AED", "#BE185D"];

export const POST_PALETTE = [
  { name: "Rosa", color: "#E98B8B" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Durazno", color: "#F4B26A" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Verde", color: "#7FD38C" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Azul", color: "#8FA8E0" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Lila", color: "#C9A0DC" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Aqua", color: "#6CC5BF" }, // ui-ok: dato guardado en el post, igual en ambos temas
];

export const FIELD_TYPES: { id: CustomFieldDefinition["type"]; label: string }[] = [
  { id: "text", label: "Texto" },
  { id: "number", label: "Número" },
  { id: "date", label: "Fecha" },
  { id: "url", label: "Enlace" },
  { id: "checkbox", label: "Casilla" },
  { id: "select", label: "Opciones" },
];

export const STATUS_TEXT: Record<PostStatus, string> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
};

export interface UploadSlot {
  id: string;
  file: File;
  percent: number;
  error?: string;
  warning?: string;
  handle?: UploadHandle;
}

export type Popover = "assignee" | "notify" | "color" | "workflow" | "field" | "date" | null;

export function NetworkSettings({
  network,
  settings,
  formats,
  generalFormat,
  isVideo,
  disabled,
  onChange,
}: {
  network: SocialNetwork;
  settings: PlatformSettings;
  formats: PostFormat[];
  generalFormat: PostFormat;
  isVideo: boolean;
  disabled: boolean;
  onChange: (patch: Partial<PlatformSettings>) => void;
}) {
  const text = (key: keyof PlatformSettings, label: string, placeholder: string, maxLength?: number) => (
    <label key={key}>
      {label}
      <input className="hubly-cal-input" disabled={disabled} value={String(settings[key] ?? "")} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange({ [key]: e.target.value || undefined })} />
    </label>
  );
  return (
    <div className="hubly-composer-netsettings">
      <strong className="hubly-composer-nethead">Ajustes de {network}</strong>
      <label>
        Formato en {network}
        <select className="hubly-cal-input" disabled={disabled} value={settings.format ?? ""} onChange={(e) => onChange({ format: (e.target.value || undefined) as PostFormat | undefined })}>
          <option value="">Igual que General ({generalFormat})</option>
          {formats.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {network === "Instagram" && [text("firstComment", "Primer comentario", "Opcional", 2200), text("location", "Ubicación", "Opcional")]}
      {network === "YouTube" && text("title", "Título del video", "Hasta 100 caracteres", 100)}
      {network === "Pinterest" && [text("title", `Título del Pin · ${(settings.title ?? "").length}/100`, "Cuéntales de qué se trata tu Pin", 100), text("boardName", "Tablero", "Nombre del tablero"), text("link", "Enlace", "https://…")]}
      {network === "Pinterest" && settings.link && !/^https:\/\//i.test(settings.link) && <small className="hubly-composer-fielderror">Pinterest pide un enlace que empiece con https://</small>}
      {network === "TikTok" && <div className="hubly-composer-fullrow"><TikTokSettings settings={settings} isVideo={isVideo} disabled={disabled} onChange={onChange} /></div>}
      {network === "Reddit" && [text("subreddit", "Comunidad", "r/marketing"), text("title", "Título del hilo", "Hasta 300 caracteres", 300), text("flair", "Etiqueta", "Opcional")]}
      {network === "Google Business" && (
        <>
          <label>
            Tipo de publicación
            <select className="hubly-cal-input" disabled={disabled} value={settings.topicType ?? "STANDARD"} onChange={(e) => onChange({ topicType: e.target.value as PlatformSettings["topicType"] })}>
              <option value="STANDARD">Novedad</option>
              <option value="EVENT">Evento</option>
              <option value="OFFER">Oferta</option>
            </select>
          </label>
          {settings.topicType && settings.topicType !== "STANDARD" && text("title", "Título", "Título del evento u oferta")}
          {settings.topicType === "OFFER" && text("couponCode", "Código de cupón", "Opcional")}
          <label>
            Botón
            <select className="hubly-cal-input" disabled={disabled} value={settings.callToAction ?? "Más información"} onChange={(e) => onChange({ callToAction: e.target.value })}>
              {["Más información", "Reservar", "Pedir", "Comprar", "Registrarse", "Llamar"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </>
      )}
      <small className="hubly-composer-hint">Estos ajustes se guardan para tu referencia al publicar.</small>
    </div>
  );
}
