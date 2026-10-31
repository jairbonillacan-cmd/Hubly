export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/** Sin claves la app corre en modo demo, con datos locales y sin cuentas. */
export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Evita redirecciones abiertas: solo rutas internas. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
