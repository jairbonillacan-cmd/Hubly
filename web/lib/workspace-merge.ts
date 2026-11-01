/** Fusión a tres bandas del documento: une los cambios de dos personas salvo que toquen lo mismo. */

type Doc = Record<string, unknown>;

// Son de cada persona, o el servidor los recalcula: nunca chocan.
const OWN_KEYS = new Set(["profile", "activeBrandId", "testClock", "team", "schemaVersion", "workspaceId"]);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const isRowList = (value: unknown): value is { id: string }[] =>
  Array.isArray(value) && value.every((x) => typeof x === "object" && x !== null && typeof (x as { id?: unknown }).id === "string");

function mergeRows(base: { id: string }[], mine: { id: string }[], theirs: { id: string }[], path: string, conflicts: string[]) {
  const byId = (rows: { id: string }[]) => new Map(rows.map((r) => [r.id, r]));
  const [b, m, t] = [byId(base), byId(mine), byId(theirs)];
  const out: { id: string }[] = [];
  for (const row of theirs) {
    const before = b.get(row.id);
    const my = m.get(row.id);
    if (!before) {
      // Lo creó la otra persona, salvo que ambas hayan creado el mismo id.
      if (my && !same(my, row)) conflicts.push(`${path}:${row.id}`);
      out.push(row);
    } else if (!my) {
      // Lo borré yo: si la otra persona lo cambió, hay que preguntar.
      if (!same(before, row)) {
        conflicts.push(`${path}:${row.id}`);
        out.push(row);
      }
    } else if (same(my, before)) {
      out.push(row);
    } else if (same(row, before) || same(my, row)) {
      out.push(my);
    } else {
      conflicts.push(`${path}:${row.id}`);
      out.push(row);
    }
  }
  for (const row of mine) {
    if (t.has(row.id)) continue;
    const before = b.get(row.id);
    if (!before) out.push(row);
    // La otra persona lo borró: si yo lo cambié, hay que preguntar.
    else if (!same(before, row)) conflicts.push(`${path}:${row.id}`);
  }
  return out;
}

export function mergeWorkspace<T extends object>(baseDoc: T, mineDoc: T, theirsDoc: T): { merged: T; conflicts: string[] } {
  const [base, mine, theirs] = [baseDoc as Doc, mineDoc as Doc, theirsDoc as Doc];
  const merged: Doc = { ...theirs };
  const conflicts: string[] = [];
  for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const [b, m, t] = [base[key], mine[key], theirs[key]];
    if (OWN_KEYS.has(key) || same(t, b) || same(m, t)) merged[key] = m;
    else if (same(m, b)) merged[key] = t;
    else if (isRowList(m) && isRowList(t)) merged[key] = mergeRows(isRowList(b) ? b : [], m, t, key, conflicts);
    else conflicts.push(key);
  }
  return { merged: merged as T, conflicts };
}
