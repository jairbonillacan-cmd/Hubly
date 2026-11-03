/*
 * Enlaces del portal del cliente (/share/[token]).
 * Con cuentas reales cada enlace se genera al pedirlo: el servidor solo guarda su hash.
 * En la demo, el token vive en la marca.
 */
import { currentAgencyId } from "@/lib/live-workspace";
import { backendEnabled } from "@/lib/supabase/config";

export function shareUrlForToken(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

/** Pide al servidor un enlace nuevo para la marca. Devuelve null si no se pudo crear. */
export async function createLiveShareUrl(brandId: string | undefined): Promise<string | null> {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandId, agencyId: currentAgencyId() }),
  });
  if (!res.ok) return null;
  const { token } = (await res.json()) as { token: string };
  return shareUrlForToken(token);
}

/** Enlace del portal de la marca: uno nuevo con cuentas reales, el de la marca en la demo. */
export async function clientShareUrl(brand: { id: string; shareToken?: string } | undefined): Promise<string | null> {
  if (backendEnabled) return createLiveShareUrl(brand?.id);
  return brand?.shareToken ? shareUrlForToken(brand.shareToken) : null;
}
