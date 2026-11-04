import assert from "node:assert/strict";
import { test } from "node:test";
import { selectActiveBrand } from "../active-brand";
import { brand } from "./test-fixtures";

test("la marca activa es la elegida, luego la primera sin archivar, luego la primera", () => {
  const lista = [
    brand({ id: "archivada", status: "archived" }),
    brand({ id: "min", status: "Activo" }),
    brand({ id: "bruma", status: "Activo" }),
  ];
  assert.equal(selectActiveBrand(lista, "bruma")?.id, "bruma");
  assert.equal(selectActiveBrand(lista, "no-existe")?.id, "min");
  assert.equal(selectActiveBrand(lista, null)?.id, "min");
  assert.equal(selectActiveBrand([brand({ id: "solo", status: "archived" })], "otra")?.id, "solo");
  assert.equal(selectActiveBrand([], "cualquiera"), undefined);
});
