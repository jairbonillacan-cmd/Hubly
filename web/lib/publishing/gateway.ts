/*
 * Puerta única hacia la publicación en redes. Las pantallas llaman a `publishing`,
 * nunca al store directamente, para que el conector real (Zernio / Late API) se
 * enchufe después como otra implementación sin tocar la interfaz.
 */
import { useHublyStore } from "@/lib/store";

export interface SocialPublishingGateway {
  /** «manual»: nada sale solo; la agencia registra la publicación con fecha y enlace. */
  readonly mode: "manual" | "provider";
  /** Cambia la fecha en que se publicará un post. */
  reschedule(postId: string, scheduledDate: string): void;
  /** Registra que el post salió, con su enlace y su fecha. */
  markPublished(postId: string, publication: { url: string; date: string }): void;
}

/** Hoy: todo corre contra el estado propio de Hubly. */
export const manualGateway: SocialPublishingGateway = {
  mode: "manual",
  reschedule: (postId, scheduledDate) => useHublyStore.getState().movePost(postId, scheduledDate),
  markPublished: (postId, publication) => useHublyStore.getState().recordPublication(postId, publication),
};

export const publishing: SocialPublishingGateway = manualGateway;
