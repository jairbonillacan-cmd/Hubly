import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_METRICS,
  adjustRecommendationValue,
  buildEnrichedMetricsPayload,
  computeRecommendationDelta,
  mapMetricKeyToCommitmentPatch,
  resolveEffectiveRecommendationValue,
  resolveRecommendationMetricTitle,
  selectAccountRecommendations,
  toggleSuggestedMetric,
  updateSuggestedMetricTarget,
} from "./recommendations";
import { brand } from "./test-fixtures";

test("una marca sin compromisos declarados no genera recomendaciones", () => {
  const r = selectAccountRecommendations(
    [brand({ id: "a", commitments: undefined as never })],
    [],
    []
  );
  assert.deepEqual(r, []);
});

test("mapMetricKeyToCommitmentPatch traduce cada clave al campo del compromiso", () => {
  assert.deepEqual(mapMetricKeyToCommitmentPatch("posts", 14), { postsCommitted: 14 });
  assert.deepEqual(mapMetricKeyToCommitmentPatch("reels", 6), { reelsCommitted: 6 });
  assert.deepEqual(mapMetricKeyToCommitmentPatch("stories", 20), {
    StoriesCommitted: 20,
    storiesCommitted: 20,
  });
  assert.deepEqual(mapMetricKeyToCommitmentPatch("ads", 3), { adCampaignsCommitted: 3 });
});

test("computeRecommendationDelta y adjustRecommendationValue respetan el mínimo de 1", () => {
  const rec = { id: "rec-1", currentCommitted: 10, recommendedCommitted: 12 };
  assert.equal(resolveEffectiveRecommendationValue(rec, {}), 12);
  assert.deepEqual(computeRecommendationDelta(rec, {}), {
    effectiveValue: 12,
    diffAbs: 2,
    diffPct: 20,
  });

  const lowered = adjustRecommendationValue(rec, {}, -25);
  assert.equal(lowered["rec-1"], 1);
  assert.deepEqual(computeRecommendationDelta(rec, lowered), {
    effectiveValue: 1,
    diffAbs: -9,
    diffPct: -90,
  });
});

test("resolveRecommendationMetricTitle usa el título propio o la etiqueta por clave", () => {
  assert.equal(
    resolveRecommendationMetricTitle({ metricKey: "posts", metricTitle: "Feed mensual" }),
    "Feed mensual"
  );
  assert.equal(
    resolveRecommendationMetricTitle({ metricKey: "reels", metricTitle: "" }),
    "Reels mensuales"
  );
});

test("toggleSuggestedMetric, updateSuggestedMetricTarget y buildEnrichedMetricsPayload", () => {
  const toggled = toggleSuggestedMetric(DEFAULT_METRICS, "m-leads");
  assert.equal(toggled.find((m) => m.id === "m-leads")?.checked, true);

  const updated = updateSuggestedMetricTarget(toggled, "m-leads", "18");
  assert.equal(updated.find((m) => m.id === "m-leads")?.target, "18");

  const payload = buildEnrichedMetricsPayload(updated, [
    brand({ id: "b1", name: "Café Bruma", hasPaidAds: true, adBudget: 5000 }),
  ]);
  assert.equal(payload.length, 3);
  assert.equal(payload[0].name, "Café Bruma");
  assert.equal(payload[0].monthlySpend, 5000);
  assert.equal(payload[0].metrics.length, 3);
});
