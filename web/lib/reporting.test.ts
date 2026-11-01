import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMonthlyReport } from "./reporting";
import type { SocialPost } from "./types";

const base = { brandId: "b", networks: ["Instagram"], comments: [] } as unknown as SocialPost;
const post = (overrides: Partial<SocialPost>): SocialPost =>
  ({ ...base, ...overrides }) as SocialPost;

test("un mes sin datos propios no hereda lo de otros meses ni lo sin fecha", () => {
  const r = buildMonthlyReport(
    [
      post({ id: "1", scheduledDate: "2026-10-31", status: "published" }),
      post({ id: "2", scheduledDate: "2026-12-01", status: "published" }),
      post({ id: "3", scheduledDate: "", status: "draft" }),
    ],
    "2026-11"
  );
  assert.equal(r.planned, 0);
  assert.equal(r.published, 0);
  assert.equal(r.measured, 0);
  assert.equal(r.reach, 0);
  assert.equal(r.engagementRate, null);
  assert.deepEqual(r.byNetwork, []);
  assert.deepEqual(r.top, []);
});

test("el alcance en cero da tasa nula en vez de dividir entre cero", () => {
  const r = buildMonthlyReport(
    [
      post({
        id: "1",
        scheduledDate: "2026-11-05",
        status: "published",
        metrics: { reach: 0, likes: 10, comments: 2, saves: 1, shares: 3 },
      }),
    ],
    "2026-11"
  );
  assert.equal(r.reach, 0);
  assert.equal(r.interactions, 15);
  assert.equal(r.engagementRate, null);
});

test("cuenta los posts del primer y del último día del mes", () => {
  const r = buildMonthlyReport(
    [
      post({ id: "1", scheduledDate: "2026-11-01", status: "published" }),
      post({ id: "2", scheduledDate: "2026-11-30", status: "published" }),
      post({ id: "3", scheduledDate: "2026-11-15", status: "draft" }),
    ],
    "2026-11"
  );
  assert.equal(r.planned, 3);
  assert.equal(r.published, 2);
});

test("las métricas corruptas no meten NaN ni Infinity en el reporte", () => {
  const r = buildMonthlyReport(
    [
      post({
        id: "1",
        scheduledDate: "2026-11-05",
        status: "published",
        network: "Instagram",
        metrics: { reach: Number.NaN, likes: 10, comments: 5, saves: 1, shares: 4 },
      }),
      post({
        id: "2",
        scheduledDate: "2026-11-06",
        status: "published",
        network: "Instagram",
        metrics: { reach: Number.POSITIVE_INFINITY, likes: 1, comments: 1, saves: 1, shares: 1 },
      }),
    ],
    "2026-11"
  );
  assert.equal(Number.isFinite(r.reach), true);
  assert.equal(Number.isFinite(r.interactions), true);
  assert.equal(Number.isFinite(r.saves), true);
  assert.ok(r.engagementRate === null || Number.isFinite(r.engagementRate));
  for (const row of r.byNetwork) {
    assert.equal(Number.isFinite(row.reach), true);
  }
});
