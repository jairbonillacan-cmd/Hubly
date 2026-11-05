import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveReportMonth } from "./reports";

test("resolveReportMonth acepta un mes válido del enlace", () => {
  assert.equal(resolveReportMonth("2026-10", "2026-11-04"), "2026-10");
});

test("resolveReportMonth cae al mes de hoy si falta o no tiene forma de mes", () => {
  assert.equal(resolveReportMonth("", "2026-11-04"), "2026-11");
  assert.equal(resolveReportMonth(null, "2026-11-04"), "2026-11");
  assert.equal(resolveReportMonth("2026-13", "2026-11-04"), "2026-11");
  assert.equal(resolveReportMonth("octubre", "2026-11-04"), "2026-11");
  assert.equal(resolveReportMonth("2026-1", "2026-11-04"), "2026-11");
});
