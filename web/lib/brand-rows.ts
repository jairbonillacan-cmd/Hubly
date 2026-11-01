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

export interface WorkspaceItemRow {
  collection: string;
  data: unknown;
}

// Igual que brand_scoped_collections() en la migración 0015.
const BRAND_SCOPED_COLLECTIONS = ["ideas", "taskLists", "notebooks", "assets", "projects", "ads", "activityEvents", "notifications"];

/** Agrupa las filas por colección. Una colección sin filas queda vacía: no hay que volver al documento. */
export function groupWorkspaceItems(rows: WorkspaceItemRow[]): Record<string, unknown[]> {
  const groups: Record<string, unknown[]> = Object.fromEntries(BRAND_SCOPED_COLLECTIONS.map((c) => [c, []]));
  for (const row of rows) groups[row.collection]?.push(row.data);
  return groups;
}
