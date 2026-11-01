import assert from "node:assert/strict";
import test from "node:test";
import { copyText } from "./clipboard";

test("copyText avisa si copió", async () => {
  let copied = "";
  const ok = await copyText("hola", { writeText: async (t) => void (copied = t) });
  assert.equal(ok, true);
  assert.equal(copied, "hola");
});

test("copyText devuelve false si el navegador lo rechaza o no existe", async () => {
  assert.equal(await copyText("hola", { writeText: async () => { throw new Error("denegado"); } }), false);
  assert.equal(await copyText("hola", undefined), false);
});
