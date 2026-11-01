export type MediaKind = "image" | "video" | "pdf" | "doc";

export const MEDIA_BUCKET = "media";
export const MAX_MEDIA_PER_POST = 10;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

// Lista cerrada: SVG puede llevar scripts, y "image/svg+xml; x=1" también empieza por image/.
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"]);

const DOCUMENT_MIMES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export interface MediaRecord {
  id: string;
  brandId: string;
  folder: string;
  name: string;
  kind: MediaKind;
  mime: string;
  sizeBytes: number;
  status: "pending" | "ready";
  createdAt: string;
}

export function mediaKindFor(mime: string): MediaKind | null {
  if (IMAGE_MIMES.has(mime)) return "image";
  if (mime === "video/mp4" || mime === "video/quicktime" || mime === "video/webm") return "video";
  if (mime === "application/pdf") return "pdf";
  if (DOCUMENT_MIMES.has(mime)) return "doc";
  return null;
}

export function maxBytesFor(kind: MediaKind): number {
  if (kind === "video") return MAX_VIDEO_BYTES;
  if (kind === "image") return MAX_IMAGE_BYTES;
  return MAX_DOCUMENT_BYTES;
}

/** Devuelve el motivo del rechazo o null: la misma regla corre en navegador y servidor. */
export function mediaRejection(mime: string, sizeBytes: number): string | null {
  const kind = mediaKindFor(mime);
  if (!kind) return "Ese tipo de archivo no se admite.";
  if (sizeBytes <= 0) return "El archivo está vacío.";
  if (sizeBytes > maxBytesFor(kind)) {
    return `Supera el límite de ${Math.round(maxBytesFor(kind) / (1024 * 1024))} MB para ${kind === "video" ? "video" : kind === "image" ? "imagen" : "documento"}.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const safeFileName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120) || "archivo";

export const mediaFileUrl = (assetId: string) => `/api/media/${assetId}/file`;
export const shareMediaFileUrl = (token: string, assetId: string) => `/api/share/${encodeURIComponent(token)}/media/${assetId}`;

/** Busca el códec en la caja `stsd` de un MP4: HEVC no se reproduce en todos los navegadores ni redes. */
export function mp4UsesHevc(bytes: Uint8Array): boolean {
  const text = String.fromCharCode(...bytes.subarray(0, Math.min(bytes.length, 65536)));
  return /stsd[\s\S]{0,32}(hvc1|hev1|dvh1|dvhe)/.test(text);
}
