import assert from "node:assert/strict";
import test from "node:test";
import type { NextStep } from "./engine";
import { runBatch, type JobStore, type PublishJob, type PublishProvider } from "./runner";
import { decryptToken, encryptToken } from "./token-crypto";

const job = (id: string): PublishJob => ({ id, accountId: "c1", postId: `p-${id}`, attempts: 1 });
const now = () => new Date("2026-11-01T12:00:00Z");

function memoryStore(jobs: PublishJob[]) {
  const finished = new Map<string, NextStep>();
  const reconnect: string[] = [];
  const store: JobStore = {
    claim: async () => jobs.splice(0),
    finish: async (j, step) => void finished.set(j.id, step),
    markReconnect: async (id) => void reconnect.push(id),
  };
  return { store, finished, reconnect };
}

test("publica y guarda el resultado", async () => {
  const { store, finished } = memoryStore([job("a")]);
  const provider: PublishProvider = { prepare: async () => "listo", publish: async () => ({ kind: "published", externalId: "x1" }) };
  assert.equal(await runBatch(store, provider, now), 1);
  assert.deepEqual(finished.get("a"), { status: "published", externalId: "x1", url: undefined });
});

test("si falla preparar se reintenta y nunca se llama a publicar", async () => {
  const { store, finished } = memoryStore([job("a")]);
  let published = 0;
  const provider: PublishProvider = {
    prepare: async () => { throw new Error("descarga"); },
    publish: async () => { published++; return { kind: "published", externalId: "x" }; },
  };
  await runBatch(store, provider, now);
  assert.equal(finished.get("a")?.status, "retry");
  assert.equal(published, 0);
});

test("si publicar lanza un error queda sin confirmar", async () => {
  const { store, finished } = memoryStore([job("a")]);
  const provider: PublishProvider = { prepare: async () => "listo", publish: async () => { throw new Error("tiempo agotado"); } };
  await runBatch(store, provider, now);
  assert.deepEqual(finished.get("a"), { status: "unconfirmed", error: "tiempo agotado" });
});

test("un error de autenticación marca la cuenta y no detiene el lote", async () => {
  const { store, finished, reconnect } = memoryStore([job("a"), job("b")]);
  const provider: PublishProvider = {
    prepare: async (j) => j.id,
    publish: async (_j, id) => (id === "a" ? { kind: "auth", message: "token" } : { kind: "published", externalId: "x2" }),
  };
  await runBatch(store, provider, now);
  assert.deepEqual(reconnect, ["c1"]);
  assert.equal(finished.get("b")?.status, "published");
});

test("el token cifrado se recupera y detecta manipulación", () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  const sealed = encryptToken("secreto", key);
  assert.ok(!sealed.includes("secreto"));
  assert.equal(decryptToken(sealed, key), "secreto");
  const parts = sealed.split(".");
  parts[3] = Buffer.from("otro").toString("base64");
  assert.throws(() => decryptToken(parts.join("."), key));
  assert.throws(() => decryptToken(sealed, Buffer.alloc(32, 8).toString("base64")));
  assert.throws(() => encryptToken("x", "corta"));
});
