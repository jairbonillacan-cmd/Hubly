/*
 * Etiquetas legibles para los valores internos. Ningún código como `pending`,
 * `viewer` o `pdf` llega a la pantalla sin pasar por aquí.
 */
import type { MediaAsset, PostStatus, PostStatusLabel } from "@/lib/types";

/** Nombre corto del estado: el que se guarda en `statusLabel` y se ve en tablas y filas. */
export const POST_STATUS_LABEL: Record<PostStatus, PostStatusLabel> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
};

/** Nombre del estado visto desde el cliente: pastillas de la parrilla y del portal. */
export const POST_STATUS_CLIENT_LABEL: Record<PostStatus, string> = {
  draft: "Borrador",
  pending: "Esperando cliente",
  changes: "Cambios solicitados",
  approved: "Aprobado por cliente",
  scheduled: "Programado",
  published: "Publicado",
};

export const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  admin: "Administración",
  editor: "Edición",
  viewer: "Solo lectura",
};

export const MEDIA_KIND_LABEL: Record<MediaAsset["kind"], string> = {
  video: "Video",
  image: "Imagen",
  pdf: "PDF",
  doc: "Documento",
};

/** Etiqueta de `value`, o `fallback` si el valor no está en el mapa. Nunca devuelve el código crudo. */
export function label<K extends string>(map: Partial<Record<K, string>>, value: K | null | undefined, fallback = "Otro"): string {
  return (value && map[value]) || fallback;
}

export const postStatusLabel = (status: PostStatus | null | undefined) => label(POST_STATUS_LABEL, status, "Borrador");

/** Los roles de `TeamMember` son texto libre que escribe la agencia: si no es un código conocido, se muestra tal cual. */
export const roleLabel = (role: string | null | undefined) => (role ? ROLE_LABEL[role] ?? role : "Sin rol");
