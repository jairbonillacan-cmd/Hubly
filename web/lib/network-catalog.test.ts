import assert from "node:assert/strict";
import { test } from "node:test";
import { NETWORKS, captionLevel, countHashtags, feedCutIndex, networkIssues, networkSpec } from "./network-catalog";

test("cada red del catálogo tiene límites coherentes y sin duplicados", () => {
  const ids = NETWORKS.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of NETWORKS) {
    assert.ok(n.maxChars > 0, `${n.id} sin límite de caracteres`);
    assert.ok(n.maxHashtags >= 0, `${n.id} con hashtags negativos`);
    assert.ok(n.maxMedia >= 1, `${n.id} sin archivos permitidos`);
    assert.ok(n.formats.length > 0, `${n.id} sin formatos`);
    if (n.feedCut !== null) {
      assert.ok(n.feedCut > 0 && n.feedCut <= n.maxChars, `${n.id} con corte de feed incoherente`);
    }
  }
});

test("una red sin datos no produce reglas ni rompe el catálogo", () => {
  assert.deepEqual(networkIssues({ networks: [], caption: "", media: [] }), []);
  const spec = networkSpec("Orkut" as never);
  assert.equal(spec.id, "Instagram");
  assert.equal(countHashtags(""), 0);
});

test("el aviso de copy dispara justo al 90% y al superar el límite", () => {
  assert.equal(captionLevel(0, 280), "ok");
  assert.equal(captionLevel(252, 280), "ok");
  assert.equal(captionLevel(253, 280), "near");
  assert.equal(captionLevel(280, 280), "near");
  assert.equal(captionLevel(281, 280), "over");
});

test("el corte del feed gana por el límite más cercano", () => {
  const caption = "a\nb\nc\nd" + "x".repeat(300);
  assert.equal(feedCutIndex(caption, "Facebook"), 5);
  assert.equal(feedCutIndex("x".repeat(300), "Facebook"), 250);
  assert.equal(feedCutIndex("a\nb", "X"), null);
  assert.equal(feedCutIndex("x".repeat(150), "Instagram"), 125);
});
