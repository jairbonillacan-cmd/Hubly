import assert from "node:assert/strict";
import test from "node:test";
import { mergeWorkspace } from "./workspace-merge";

const row = (id: string, title = "a") => ({ id, title });
const doc = (posts: { id: string; title: string }[], extra = {}) => ({ posts, agencyName: "X", ...extra });

test("une cambios en filas distintas", () => {
  const base = doc([row("1"), row("2")]);
  const { merged, conflicts } = mergeWorkspace(base, doc([row("1", "mío"), row("2")]), doc([row("1"), row("2", "suyo")]));
  assert.deepEqual(conflicts, []);
  assert.deepEqual(merged.posts, [row("1", "mío"), row("2", "suyo")]);
});

test("avisa si ambas cambian la misma fila de forma distinta", () => {
  const { conflicts } = mergeWorkspace(doc([row("1")]), doc([row("1", "mío")]), doc([row("1", "suyo")]));
  assert.deepEqual(conflicts, ["posts:1"]);
});

test("el mismo cambio en ambas no es conflicto", () => {
  const { conflicts, merged } = mergeWorkspace(doc([row("1")]), doc([row("1", "igual")]), doc([row("1", "igual")]));
  assert.deepEqual(conflicts, []);
  assert.deepEqual(merged.posts, [row("1", "igual")]);
});

test("conserva lo creado por cada persona", () => {
  const { merged, conflicts } = mergeWorkspace(doc([row("1")]), doc([row("1"), row("mio")]), doc([row("1"), row("suyo")]));
  assert.deepEqual(conflicts, []);
  assert.deepEqual(merged.posts.map((p) => p.id), ["1", "suyo", "mio"]);
});

test("respeta los borrados sin revivir nada", () => {
  const base = doc([row("1"), row("2")]);
  const { merged, conflicts } = mergeWorkspace(base, doc([row("2")]), doc([row("1")]));
  assert.deepEqual(conflicts, []);
  assert.deepEqual(merged.posts, []);
});

test("borrar lo que la otra persona cambió es conflicto, en ambos sentidos", () => {
  const base = doc([row("1")]);
  assert.deepEqual(mergeWorkspace(base, doc([]), doc([row("1", "suyo")])).conflicts, ["posts:1"]);
  assert.deepEqual(mergeWorkspace(base, doc([row("1", "mío")]), doc([])).conflicts, ["posts:1"]);
});

test("valores simples: une si solo cambió una persona y avisa si ambas", () => {
  const base = doc([], { agencyName: "X" });
  assert.equal(mergeWorkspace(base, doc([], { agencyName: "Y" }), base).merged.agencyName, "Y");
  assert.equal(mergeWorkspace(base, base, doc([], { agencyName: "Z" })).merged.agencyName, "Z");
  assert.deepEqual(mergeWorkspace(base, doc([], { agencyName: "Y" }), doc([], { agencyName: "Z" })).conflicts, ["agencyName"]);
});

test("lo personal siempre es de quien guarda", () => {
  const base = { activeBrandId: "a", posts: [] };
  const { merged, conflicts } = mergeWorkspace(base, { activeBrandId: "b", posts: [] }, { activeBrandId: "c", posts: [] });
  assert.deepEqual(conflicts, []);
  assert.equal(merged.activeBrandId, "b");
});
