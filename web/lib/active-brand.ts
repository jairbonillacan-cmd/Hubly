import type { BrandWorkspace } from "./types";

/**
 * Marca activa: la elegida si existe; si no, la primera sin archivar; si no, la primera.
 * Es la misma que muestra el sidebar, así que ninguna pantalla ni acción la calcula por su cuenta.
 */
export function selectActiveBrand(
  brands: BrandWorkspace[],
  activeBrandId: string | null | undefined
): BrandWorkspace | undefined {
  return (
    brands.find((b) => b.id === activeBrandId) ||
    brands.find((b) => b.status !== "archived") ||
    brands[0]
  );
}
