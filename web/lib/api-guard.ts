/** Lee el cuerpo con tope real: Content-Length puede faltar o mentir. Devuelve null si lo supera. */
export async function readBodyText(request: Request, maxBytes: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

/** JSON de una petición pequeña. Devuelve null si es inválido o supera el tope. */
export async function readJson<T>(request: Request, maxBytes = 16 * 1024): Promise<T | null> {
  const text = await readBodyText(request, maxBytes).catch(() => null);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

type Rule = { method: string; prefix: string; limit: number; windowMs: number };

const MINUTE = 60_000;

// El primer prefijo que coincide manda. Por IP: se cuenta antes de saber quién es la persona,
// y los límites de medios son amplios porque una agencia entera puede salir por la misma IP.
const RULES: Rule[] = [
  { method: "POST", prefix: "/api/waitlist", limit: 5, windowMs: 10 * MINUTE },
  { method: "POST", prefix: "/api/ai/", limit: 20, windowMs: MINUTE },
  { method: "POST", prefix: "/api/agency", limit: 10, windowMs: MINUTE },
  { method: "POST", prefix: "/api/members", limit: 60, windowMs: MINUTE },
  { method: "POST", prefix: "/api/media", limit: 120, windowMs: MINUTE },
  { method: "POST", prefix: "/api/share", limit: 120, windowMs: MINUTE },
  { method: "GET", prefix: "/api/share/", limit: 600, windowMs: MINUTE },
  { method: "POST", prefix: "/api/invitations/", limit: 30, windowMs: MINUTE },
  { method: "GET", prefix: "/api/invitations/", limit: 60, windowMs: MINUTE },
];

const MAX_TRACKED_KEYS = 50_000;
const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Devuelve los segundos que faltan si se pasó del límite, o 0 si puede seguir.
 * Vive en la memoria de cada instancia: frena ráfagas, no reemplaza un firewall.
 */
export function rateLimitWait(method: string, pathname: string, ip: string, now = Date.now()): number {
  const rule = RULES.find((r) => r.method === method && pathname.startsWith(r.prefix));
  if (!rule) return 0;
  if (hits.size >= MAX_TRACKED_KEYS) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
  }
  const key = `${rule.method}:${rule.prefix}:${ip}`;
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + rule.windowMs });
    return 0;
  }
  entry.count += 1;
  return entry.count > rule.limit ? Math.ceil((entry.resetAt - now) / 1000) : 0;
}

/** Lo que cambia datos solo se acepta desde la propia app. Sin Origin no hay navegador que engañar. */
export function isCrossOriginWrite(method: string, origin: string | null, host: string | null): boolean {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS" || !origin) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/**
 * Confianza en las cabeceras reenviadas por un proxy. El cliente puede escribirlas,
 * así que solo valen si algo conocido las reescribe antes:
 * - TRUST_FORWARDED_HEADERS=1 → siempre (self-host detrás de un proxy que las pisa).
 * - TRUST_FORWARDED_HEADERS=0 → nunca.
 * - sin configurar → solo si la petición viene de la plataforma (Vercel), que las reescribe.
 */
export function forwardedTrust(env: string | undefined, onPlatform: boolean): "always" | "never" {
  const value = env?.trim().toLowerCase();
  if (value === "1" || value === "true" || value === "always") return "always";
  if (value === "0" || value === "false" || value === "never") return "never";
  return onPlatform ? "always" : "never";
}

/** Host para el control de origen: el reenviado solo si hay confianza; si no, la cabecera Host. */
export function hostForOriginCheck(trusted: boolean, xForwardedHost: string | null, hostHeader: string | null): string {
  return trusted && xForwardedHost ? xForwardedHost : hostHeader || "local";
}

/** IP para el límite de tasa. Sin confianza no hay IP fiable: cubo único de la instancia.
 *  Con confianza vale el último salto que añadió el proxy, no el prefijo que escribe el cliente. */
export function ipForRateLimit(trusted: boolean, xForwardedFor: string | null, xRealIp: string | null): string {
  if (!trusted) return "local";
  const last = xForwardedFor?.split(",").map((s) => s.trim()).filter(Boolean).pop();
  return last || xRealIp?.trim() || "local";
}
