/** Núcleo del motor de publicación: decide qué sigue según lo que respondió la red. Ver docs/publicacion/ESPECIFICACION.md. */

type PublishOutcome =
  | { kind: "published"; externalId: string; url?: string }
  | { kind: "rate_limited"; retryAfterSeconds?: number }
  | { kind: "rejected"; message: string }
  | { kind: "auth"; message: string }
  | { kind: "unknown"; message: string };

type NextStep =
  | { status: "published"; externalId: string; url?: string }
  | { status: "retry"; runAt: Date }
  | { status: "failed"; error: string; reconnect: boolean }
  | { status: "unconfirmed"; error: string };

export const MAX_ATTEMPTS = 5;
const BASE_DELAY_SECONDS = 30;
const MAX_DELAY_SECONDS = 30 * 60;

/** Espera creciente con azar, para que los reintentos no salgan todos a la vez. */
export function retryDelaySeconds(attempt: number, random = Math.random()): number {
  const ceiling = Math.min(MAX_DELAY_SECONDS, BASE_DELAY_SECONDS * 2 ** Math.max(0, attempt - 1));
  return Math.ceil(ceiling / 2 + (ceiling / 2) * random);
}

/** `attempt` cuenta el intento que acaba de terminar, desde 1. */
export function nextStep(outcome: PublishOutcome, attempt: number, now: Date, random = Math.random()): NextStep {
  switch (outcome.kind) {
    case "published":
      return { status: "published", externalId: outcome.externalId, url: outcome.url };
    case "rate_limited": {
      if (attempt >= MAX_ATTEMPTS) return { status: "failed", error: "La red sigue limitando las publicaciones. Inténtalo más tarde.", reconnect: false };
      const seconds = Math.max(outcome.retryAfterSeconds ?? 0, retryDelaySeconds(attempt, random));
      return { status: "retry", runAt: new Date(now.getTime() + seconds * 1000) };
    }
    case "rejected":
      return { status: "failed", error: outcome.message, reconnect: false };
    case "auth":
      return { status: "failed", error: outcome.message, reconnect: true };
    case "unknown":
      // No se sabe si salió: repetir podría publicar dos veces.
      return { status: "unconfirmed", error: outcome.message };
  }
}
