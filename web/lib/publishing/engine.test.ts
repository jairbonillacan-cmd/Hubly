import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ATTEMPTS, nextStep, retryDelaySeconds } from "./engine";

const now = new Date("2026-11-01T12:00:00Z");

test("un resultado desconocido nunca se repite", () => {
  assert.deepEqual(nextStep({ kind: "unknown", message: "tiempo agotado" }, 1, now), { status: "unconfirmed", error: "tiempo agotado" });
});

test("el límite de tasa reintenta y respeta la espera que pide la red", () => {
  const step = nextStep({ kind: "rate_limited", retryAfterSeconds: 600 }, 1, now, 0);
  assert.equal(step.status, "retry");
  if (step.status === "retry") assert.equal(step.runAt.getTime(), now.getTime() + 600_000);
});

test("el límite de tasa se rinde al agotar los intentos", () => {
  assert.equal(nextStep({ kind: "rate_limited" }, MAX_ATTEMPTS, now).status, "failed");
});

test("un rechazo falla sin pedir reconexión y la autenticación sí la pide", () => {
  assert.deepEqual(nextStep({ kind: "rejected", message: "formato" }, 1, now), { status: "failed", error: "formato", reconnect: false });
  assert.deepEqual(nextStep({ kind: "auth", message: "token" }, 1, now), { status: "failed", error: "token", reconnect: true });
});

test("la espera crece y tiene tope", () => {
  assert.equal(retryDelaySeconds(1, 0), 15);
  assert.equal(retryDelaySeconds(1, 1), 30);
  assert.equal(retryDelaySeconds(2, 1), 60);
  assert.equal(retryDelaySeconds(50, 1), 1800);
});
