import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCommitmentSavePayload,
  createCommitmentDraft,
  resolveCommitmentPeriodKey,
  selectAccountsHealth,
  sortEvaluatedAccounts,
} from "./account-health";
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

test("resolveCommitmentPeriodKey mapea ventanas cortas a mes_actual", () => {
  assert.equal(resolveCommitmentPeriodKey("7d"), "mes_actual");
  assert.equal(resolveCommitmentPeriodKey("30d"), "mes_actual");
  assert.equal(resolveCommitmentPeriodKey("semana"), "mes_actual");
  assert.equal(resolveCommitmentPeriodKey("mes_actual"), "mes_actual");
  assert.equal(resolveCommitmentPeriodKey("mes_anterior"), "mes_anterior");
  assert.equal(resolveCommitmentPeriodKey("trimestre"), "trimestre");
});

test("sortEvaluatedAccounts coloca primero las marcas fijadas y ordena por nombre en español", () => {
  const r = selectAccountsHealth(
    [
      brand({ id: "z", name: "Zeta", pinned: false }),
      brand({ id: "a", name: "Alfa", pinned: false }),
      brand({ id: "p", name: "Omega", pinned: true }),
    ],
    [],
    [],
    { referenceNow: RELOJ }
  );
  const ordenadas = sortEvaluatedAccounts(r.accounts, "name_asc");
  assert.deepEqual(
    ordenadas.map((item) => item.brand.id),
    ["p", "a", "z"]
  );
});

test("createCommitmentDraft y buildCommitmentSavePayload escalan 7d x4 y limpian pauta inactiva", () => {
  const r = selectAccountsHealth(
    [
      brand({
        id: "m1",
        hasPaidAds: true,
        monthlySpend: 12000,
      }),
    ],
    [],
    [],
    { period: "7d", referenceNow: RELOJ }
  );
  const draft = createCommitmentDraft(r.accounts[0]);
  draft.postsCommitted = 3;
  draft.postsCompleted = 2;
  draft.StoriesCommitted = 5;
  draft.StoriesCompleted = 4;
  draft.reelsCommitted = 2;
  draft.reelsCompleted = 1;
  draft.adCampaignsCommitted = 2;
  draft.adCampaignsCompleted = 1;

  const saved7d = buildCommitmentSavePayload(draft, "7d");
  assert.equal(saved7d.targetPeriodKey, "mes_actual");
  assert.equal(saved7d.commitmentsPatch.postsCommitted, 12);
  assert.equal(saved7d.commitmentsPatch.postsCompleted, 8);
  assert.equal(saved7d.commitmentsPatch.StoriesCommitted, 20);
  assert.equal(saved7d.commitmentsPatch.storiesCompleted, 16);
  assert.equal(saved7d.commitmentsPatch.reelsCommitted, 8);
  // Las campañas de pauta no se multiplican x4 en 7d
  assert.equal(saved7d.commitmentsPatch.adCampaignsCommitted, 2);
  assert.equal(saved7d.commitmentsPatch.adSpend, 12000);

  const sinPauta = buildCommitmentSavePayload({ ...draft, hasPaidAds: false }, "mes_anterior");
  assert.equal(sinPauta.targetPeriodKey, "mes_anterior");
  assert.equal(sinPauta.brandPatch.hasPaidAds, false);
  assert.equal(sinPauta.commitmentsPatch.adSpend, 0);
  assert.equal(sinPauta.commitmentsPatch.postsCommitted, 3);
});
