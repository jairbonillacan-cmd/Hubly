/*
 * Etiquetas legibles para los valores internos. Ningún código como `pending`,
 * `image` o `owner` llega a la pantalla sin pasar por aquí.
 *
 * Hay dos mapas de estado a propósito: `POST_STATUS_LABEL` es el nombre corto
 * que guarda `statusLabel` y se usa dentro de la agencia; el del cliente es el
 * que ve quien aprueba en su parrilla.
 */
import type { MediaAsset, PostStatus, PostStatusLabel } from "./types";

export const POST_STATUS_LABEL: Record<PostStatus, PostStatusLabel> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
};

export const POST_STATUS_CLIENT_LABEL: Record<PostStatus, string> = {
  draft: "Borrador",
  pending: "Esperando cliente",
  changes: "Cambios solicitados",
  approved: "Aprobado por cliente",
  scheduled: "Programado",
  published: "Publicado",
};

/** `TeamMember.role` llega con el código del permiso o, en cuentas viejas, con texto ya escrito en español. */
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
