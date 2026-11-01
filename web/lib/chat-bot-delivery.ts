import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TIMEOUT_MS = 5000;

/** Direcciones que un bot jamás debe alcanzar desde el servidor: red interna y metadatos de la nube. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(ip) === 6) return ip === "::1" || ip === "::" || /^(fc|fd|fe[89ab])/.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

/** Solo https hacia direcciones públicas. Las pruebas locales lo relajan con una variable propia. */
export async function isAllowedTarget(raw: string, allowLocal = process.env.CHAT_BOTS_ALLOW_LOCAL === "1"): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (allowLocal && url.protocol === "http:" && url.hostname === "localhost") return true;
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address));
  } catch {
    return false;
  }
}

export interface BotDelivery {
  url: string;
  payload: string;
  signature: string;
}

/** Entrega firmada. Sin seguir redirecciones: podrían llevar a la red interna tras validar. */
export async function deliver(delivery: BotDelivery): Promise<boolean> {
  if (!(await isAllowedTarget(delivery.url))) return false;
  try {
    const res = await fetch(delivery.url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "Content-Type": "application/json", "X-Hubly-Firma": `sha256=${delivery.signature}` },
      body: delivery.payload,
    });
    return res.ok;
  } catch {
    return false;
  }
}
