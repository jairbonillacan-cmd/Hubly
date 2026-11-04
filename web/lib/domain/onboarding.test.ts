import assert from "node:assert/strict";
import { test } from "node:test";
import { selectOnboardingStatus } from "./onboarding";

test("el onboarding con estado vacío no avanza ni rompe", () => {
  const r = selectOnboardingStatus({});
  assert.equal(r.completedCount, 0);
  assert.equal(r.progressPercent, 0);
  assert.equal(r.totalCount, 4);
  assert.equal(r.dismissed, false);
});
