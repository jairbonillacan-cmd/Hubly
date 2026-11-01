import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorkspaceData } from "./seed-data";

const setUp = async () => {
  const { useHublyStore } = await import("./store");
  const seed = createSeedWorkspaceData("prueba");
  useHublyStore.setState({ ...seed, role: null });
  return useHublyStore;
};

test("guardar un post existente conserva id y comentarios y deja bitácora", async () => {
  const store = await setUp();
  const brandId = store.getState().brands[0].id;
  store.getState().savePost({ brandId, title: "Original", caption: "copy", network: "Instagram", networks: ["Instagram"], format: "Imagen", cover: "steam", status: "draft", scheduledDate: "2026-11-05", scheduledTime: "", assignee: "", pillar: "General" });
  const creado = store.getState().posts[0];
  store.getState().addPostComment(creado.id, "Ajusta el copy", "Ana", "agency");

  const { comments: _comments, ...edicion } = creado;
  store.getState().savePost(edicion);
  const coincidencias = store.getState().posts.filter((p) => p.id === creado.id);
  assert.equal(coincidencias.length, 1);
  const guardado = coincidencias[0];
  assert.equal(guardado.comments.length, 1);
  assert.equal(guardado.comments[0].text, "Ajusta el copy");
  assert.match(guardado.activity?.[0]?.text ?? "", /^Guardó el post como «Borrador»$/);
});

test("updateBrand mantiene sincronizadas las redes y la etiqueta de pauta", async () => {
  const store = await setUp();
  const brandId = store.getState().brands[0].id;
  store.getState().updateBrand(brandId, { connectedNetworks: ["TikTok", "X"] });
  const conRedes = store.getState().brands.find((b) => b.id === brandId)!;
  assert.deepEqual(conRedes.Networks, ["TikTok", "X"]);
  assert.deepEqual(conRedes.connectedNetworks, ["TikTok", "X"]);
  store.getState().updateBrand(brandId, { hasPaidAds: true, adBudget: 800 });
  const conPauta = store.getState().brands.find((b) => b.id === brandId)!;
  assert.equal(conPauta.hasPaidAds, true);
  assert.equal(conPauta.paidAdsLabel, "con pauta");
  store.getState().updateBrand(brandId, { paidAdsLabel: "sin pauta" });
  assert.equal(store.getState().brands.find((b) => b.id === brandId)!.paidAdsLabel, "sin pauta");
});

test("descartar una recomendación dos veces no la registra dos veces", async () => {
  const store = await setUp();
  store.getState().dismissRecommendation("rec-x");
  store.getState().dismissRecommendation("rec-x");
  assert.deepEqual(store.getState().dismissedRecommendationIds, ["rec-x"]);
});

test("alternar una tarea con el reloj de prueba fija la hora de cierre", async () => {
  const store = await setUp();
  const reloj = "2026-10-31T18:00:00.000Z";
  store.setState({ testClock: { fixedIsoNow: reloj } });
  const tarea = store.getState().tasks[0];
  store.getState().toggleTaskStatus(tarea.id);
  const hecha = store.getState().tasks.find((t) => t.id === tarea.id)!;
  assert.equal(hecha.completed, true);
  assert.equal(hecha.status, "done");
  assert.equal(hecha.completedAt, reloj);
  store.getState().toggleTaskStatus(tarea.id);
  const reabierta = store.getState().tasks.find((t) => t.id === tarea.id)!;
  assert.equal(reabierta.completed, false);
  assert.equal(reabierta.status, "todo");
  assert.equal(reabierta.completedAt, undefined);
});
