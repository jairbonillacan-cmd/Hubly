import assert from "node:assert/strict";
import test from "node:test";
import { brandFromRow, groupWorkspaceItems } from "./brand-rows";

test("la fila manda sobre lo guardado en data", () => {
  const brand = brandFromRow({ id: "m1", name: "Uno", slug: "uno", data: { id: "viejo", name: "Viejo", color: "#111" } });
  assert.equal(brand.id, "m1");
  assert.equal(brand.name, "Uno");
  assert.equal(brand.slug, "uno");
  assert.equal(brand.color, "#111");
});

test("agrupa por colección y deja vacías las que no tienen filas", () => {
  const groups = groupWorkspaceItems([{ collection: "notebooks", data: { id: "n1" } }, { collection: "desconocida", data: {} }]);
  assert.deepEqual(groups.notebooks, [{ id: "n1" }]);
  assert.deepEqual(groups.ideas, []);
  assert.equal(groups.desconocida, undefined);
});
