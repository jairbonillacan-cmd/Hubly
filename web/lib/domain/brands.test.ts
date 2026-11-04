import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCommitmentPatch, applyRecommendationToBrand } from "./brands";
import type { AccountCommitment, BrandWorkspace, PeriodCommitmentSnapshot } from "../types";

const snap = (overrides: Partial<PeriodCommitmentSnapshot> = {}): PeriodCommitmentSnapshot => ({
  period: "mes_actual",
  postsCommitted: 12,
  postsCompleted: 3,
  StoriesCommitted: 8,
  StoriesCompleted: 2,
  storiesCommitted: 8,
  storiesCompleted: 2,
  reelsCommitted: 4,
  reelsCompleted: 1,
  adCampaignsCommitted: 2,
  adCampaignsCompleted: 1,
  ...overrides,
});

const brand = (): BrandWorkspace =>
  ({
    id: "brand-a",
    name: "Café Bruma",
    monthlyPostTarget: 12,
    commitments: {
      ...snap(),
      period: "mes_actual",
      periodHistory: {
        mes_actual: snap(),
        mes_anterior: snap({ postsCommitted: 10, period: "mes_anterior" }),
        trimestre: snap({ postsCommitted: 30, period: "trimestre" }),
      },
      customMetrics: [],
      hasDeclaredCommitments: true,
    } as AccountCommitment,
  }) as BrandWorkspace;

test("el mes actual se refleja en el compromiso y en el objetivo mensual", () => {
  const siguiente = applyCommitmentPatch(brand(), { postsCommitted: 16 }, "mes_actual");
  assert.equal(siguiente.commitments.postsCommitted, 16);
  assert.equal(siguiente.commitments.periodHistory.mes_actual.postsCommitted, 16);
  assert.equal(siguiente.monthlyPostTarget, 16);
});

test("otro periodo se guarda en su histórico sin tocar el mes actual", () => {
  const siguiente = applyCommitmentPatch(brand(), { postsCommitted: 9 }, "mes_anterior");
  assert.equal(siguiente.commitments.postsCommitted, 12);
  assert.equal(siguiente.commitments.periodHistory.mes_anterior.postsCommitted, 9);
  assert.equal(siguiente.monthlyPostTarget, 12);
});

test("las Stories se sincronizan entre los dos nombres", () => {
  const siguiente = applyCommitmentPatch(brand(), { storiesCommitted: 5 }, "mes_actual");
  assert.equal(siguiente.commitments.StoriesCommitted, 5);
  assert.equal(siguiente.commitments.storiesCommitted, 5);
  assert.equal(siguiente.commitments.periodHistory.mes_actual.StoriesCompleted, 2);
});

test("un cambio parcial declara compromisos y conserva las métricas propias", () => {
  const base = brand();
  base.commitments.customMetrics = [{ id: "m-1", name: "Reseñas" } as never];
  const siguiente = applyCommitmentPatch(base, { reelsCompleted: 3 }, "mes_actual");
  assert.equal(siguiente.commitments.hasDeclaredCommitments, true);
  assert.deepEqual(siguiente.commitments.customMetrics, base.commitments.customMetrics);
  assert.equal(siguiente.commitments.reelsCompleted, 3);
});

test("una recomendación cambia su métrica y nada más del mes actual", () => {
  const base = brand();
  const conPosts = applyRecommendationToBrand(base, { metricKey: "posts", recommendedCommitted: 18 });
  assert.equal(conPosts.commitments.postsCommitted, 18);
  assert.equal(conPosts.commitments.reelsCommitted, 4);
  assert.equal(conPosts.commitments.periodHistory.mes_actual.postsCommitted, 18);
  assert.equal(conPosts.monthlyPostTarget, 18);

  const conStories = applyRecommendationToBrand(base, { metricKey: "stories", recommendedCommitted: 7 });
  assert.equal(conStories.commitments.StoriesCommitted, 7);
  assert.equal(conStories.commitments.storiesCommitted, 7);
  assert.equal(conStories.commitments.postsCommitted, 12);
});
