import assert from "node:assert/strict";
import { test } from "node:test";
import { selectAccountsHealth } from "./account-health";
import { brand, post, RELOJ, task } from "./test-fixtures";
import type { BrandWorkspace } from "../types";

test("la salud de cuentas evalúa cada marca con sus propios datos", () => {
  const brands = [
    brand({ id: "a", name: "Marca A" }),
    brand({ id: "b", name: "Marca B", archived: true }),
  ];
  const tasks = [task({ id: "v-a1", brandId: "a", dueDate: "2026-10-30" }), task({ id: "v-a2", brandId: "a", dueDate: "2026-10-29" })];
  const posts = [post({ id: "p-a", brandId: "a", status: "pending" })];
  const r = selectAccountsHealth(brands, tasks, posts, { referenceNow: RELOJ });
  assert.equal(r.summary.totalAccounts, 1); // la archivada no entra
  const cuenta = r.accounts[0];
  assert.equal(cuenta.id, "a");
  assert.equal(cuenta.overdueTasksCount, 2);
  assert.equal(cuenta.pendingApprovalsCount, 1);
  assert.ok(Number.isFinite(cuenta.fulfillmentPercent));
  assert.ok(Number.isFinite(cuenta.computedHealthScore));
});

test("una marca sin datos de compromisos sigue recibiendo porcentajes finitos", () => {
  const r = selectAccountsHealth([brand({ id: "vacia" })], [], [], { referenceNow: RELOJ });
  const cuenta = r.accounts[0];
  assert.ok(Number.isFinite(cuenta.fulfillmentPercent));
  assert.ok(Number.isFinite(cuenta.computedHealthScore));
  for (const d of cuenta.deliverables) {
    assert.ok(Number.isFinite(d.percent), `percent de ${d.key} no es finito`);
    assert.ok(d.percent >= 0 && d.percent <= 100);
  }
});

test("compromisos en cero: porcentajes definidos, sin NaN", () => {
  const enCeros = brand({
    id: "cero",
    commitments: {
      postsCommitted: 0, postsCompleted: 0,
      storiesCommitted: 0, storiesCompleted: 0,
      reelsCommitted: 0, reelsCompleted: 0,
      adCampaignsCommitted: 0, adCampaignsCompleted: 0,
      hasDeclaredCommitments: true,
    },
  } as Partial<BrandWorkspace>);
  const r = selectAccountsHealth([enCeros], [], [], { referenceNow: RELOJ });
  const cuenta = r.accounts[0];
  assert.equal(cuenta.totalCommitted, 0);
  assert.equal(cuenta.fulfillmentPercent, 0);
  for (const d of cuenta.deliverables) {
    assert.ok(Number.isFinite(d.percent));
  }
});

test("sin marcas el resumen de salud queda en ceros", () => {
  const r = selectAccountsHealth([], [], [], { referenceNow: RELOJ });
  assert.equal(r.accounts.length, 0);
  assert.equal(r.summary.totalAccounts, 0);
  assert.equal(r.summary.averageHealthScore, 0);
});
