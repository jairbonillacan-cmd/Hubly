import assert from "node:assert/strict";
import { test } from "node:test";
import { selectAccountRecommendations } from "./recommendations";
import { brand } from "./test-fixtures";

test("una marca sin compromisos declarados no genera recomendaciones", () => {
  const r = selectAccountRecommendations(
    [brand({ id: "a", commitments: undefined as never })],
    [],
    []
  );
  assert.deepEqual(r, []);
});
