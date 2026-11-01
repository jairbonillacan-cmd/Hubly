import type { BrandWorkspace } from "./types";

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  data: Record<string, unknown>;
}

/** Reconstruye la marca que espera la app desde su fila: `data` guarda lo que aún no tiene columna. */
export function brandFromRow(row: BrandRow): BrandWorkspace {
  return { ...row.data, id: row.id, name: row.name, slug: row.slug } as unknown as BrandWorkspace;
}
