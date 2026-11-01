export type MediaKind = "image" | "video" | "pdf" | "doc";

export const MEDIA_BUCKET = "media";
export const MAX_MEDIA_PER_POST = 10;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

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
  if (mime.startsWith("image/") && mime !== "image/svg+xml") return "image";
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
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "El archivo está vacío.";
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
    .replace(/\.{2,}/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-120) || "archivo";

export const mediaFileUrl = (assetId: string) => `/api/media/${assetId}/file`;
export const shareMediaFileUrl = (token: string, assetId: string) => `/api/share/${encodeURIComponent(token)}/media/${assetId}`;

/** Valida los magic bytes reales del archivo frente al tipo MIME declarado. */
export function validateMediaMagicBytes(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length === 0) return false;
  if (mime === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/gif") {
    return (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    );
  }
  if (mime === "image/webp") {
    if (bytes.length < 12) return false;
    const riff = String.fromCharCode(...bytes.subarray(0, 4));
    const webp = String.fromCharCode(...bytes.subarray(8, 12));
    return riff === "RIFF" && webp === "WEBP";
  }
  if (mime === "video/mp4" || mime === "video/quicktime") {
    if (bytes.length < 8) return false;
    const box = String.fromCharCode(...bytes.subarray(4, 8));
    return box === "ftyp" || box === "moov" || box === "wide" || box === "mdat";
  }
  if (mime === "video/webm") {
    return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  if (mime === "application/pdf") {
    if (bytes.length < 5) return false;
    const header = String.fromCharCode(...bytes.subarray(0, 5));
    return header === "%PDF-";
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  if (mime === "application/msword" || mime === "application/vnd.ms-excel" || mime === "application/vnd.ms-powerpoint") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1
    );
  }
  if (mime === "text/plain" || mime === "text/csv") {
    const sample = bytes.subarray(0, Math.min(bytes.length, 512));
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) return false;
    }
    return true;
  }
  if (mime.startsWith("image/")) {
    if (bytes.length < 12) return false;
    const box = String.fromCharCode(...bytes.subarray(4, 8));
    return box === "ftyp";
  }
  return false;
}

/** Busca el códec en la caja `stsd` de un MP4: HEVC no se reproduce en todos los navegadores ni redes. */
export function mp4UsesHevc(bytes: Uint8Array): boolean {
  const text = String.fromCharCode(...bytes.subarray(0, Math.min(bytes.length, 65536)));
  return /stsd[\s\S]{0,32}(hvc1|hev1|dvh1|dvhe)/.test(text);
}
