import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dueLabelFor, localIsoDate } from "./date";

test("addDays cruza de año", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2027-01-01", -1), "2026-12-31");
});

test("addDays respeta los años bisiestos", () => {
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2024-02-29", 1), "2024-03-01");
  assert.equal(addDays("2000-02-28", 1), "2000-02-29");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("localIsoDate mantiene el día justo antes y después de medianoche", () => {
  assert.equal(localIsoDate(new Date(2026, 9, 31, 23, 59, 59)), "2026-10-31");
  assert.equal(localIsoDate(new Date(2026, 10, 1, 0, 0, 0)), "2026-11-01");
});

test("dueLabelFor pasa a fecha fija después de una semana", () => {
  const today = "2026-10-30";
  assert.equal(dueLabelFor("2026-11-05", today), "En 6 días");
  assert.match(dueLabelFor("2026-11-06", today), /^6 nov/);
  assert.match(dueLabelFor("2026-11-30", today), /^30 nov/);
});
