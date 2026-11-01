export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/** Sin claves la app corre en modo demo, con datos locales y sin cuentas. */
export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Evita redirecciones abiertas: solo rutas internas. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.includes("\\")) return fallback;
  // El navegador ignora tabulaciones y saltos de línea: "/\t/evil.com" acabaría en otro dominio.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  const base = "https://hubly.invalid";
  try {
    return new URL(value, base).origin === base ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Para enlaces escritos por personas: solo web, correo o rutas internas, nunca javascript: ni data:. */
export function safeLinkHref(value: string | null | undefined): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith("/")) return safeNextPath(url, "") || undefined;
  try {
    return ["http:", "https:", "mailto:"].includes(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
