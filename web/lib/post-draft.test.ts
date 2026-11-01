import assert from "node:assert/strict";
import { test } from "node:test";
import { clearRecovery, draftFromPost, draftsEqual, draftToPost, hasRecovery, loadRecovery, recoveryKey, saveRecovery, type PostDraft } from "./post-draft";

const storage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
};

const borrador = (brandId: string, title = "Borrador de marca"): PostDraft => ({
  postId: null,
  brandId,
  title,
  caption: "",
  networks: ["Instagram"],
  format: "Imagen",
  cover: "steam",
  media: [],
  platformSettings: {},
  status: "draft",
  workflowStatusId: null,
  assigneeIds: [],
  assignee: "",
  color: "",
  customFields: {},
  notifyOnPublish: false,
  notifyMemberIds: [],
  scheduledDate: "",
  scheduledTime: "",
  notes: "",
  todos: [],
  documents: [],
  chat: [],
});

test("se recupera el borrador guardado y clearRecovery lo suelta", () => {
  const s = storage();
  const key = recoveryKey("u1:a1", "marca-a", null);
  saveRecovery(s, key, borrador("marca-a"));
  const recuperado = loadRecovery(s, key);
  assert.ok(recuperado);
  assert.equal(recuperado.draft.title, "Borrador de marca");
  assert.equal(recuperado.draft.brandId, "marca-a");
  assert.ok(recuperado.savedAt);
  assert.ok(draftsEqual(recuperado.draft, borrador("marca-a")));
  assert.ok(!draftsEqual(recuperado.draft, borrador("marca-a", "Otro título")));
  clearRecovery(s, key);
  assert.equal(loadRecovery(s, key), null);
});

test("datos corruptos o ausentes devuelven null en vez de romper", () => {
  const s = storage();
  const key = recoveryKey("u1:a1", "marca-a", null);
  s.setItem(key, "{esto no es json");
  assert.equal(loadRecovery(s, key), null);
  assert.equal(loadRecovery(s, recoveryKey("u1:a1", "marca-a", "inexistente")), null);
});

test("la marca no cambia al recuperar: cada marca, post y persona tienen su clave", () => {
  const s = storage();
  saveRecovery(s, recoveryKey("u1:a1", "marca-a", null), borrador("marca-a"));
  // Otra marca no ve este borrador: recuperaría null y arrancaría con la suya.
  assert.equal(loadRecovery(s, recoveryKey("u1:a1", "marca-b", null)), null);
  // Otro post de la misma marca, tampoco.
  assert.equal(loadRecovery(s, recoveryKey("u1:a1", "marca-a", "p2")), null);
  // Otra persona, tampoco.
  assert.equal(loadRecovery(s, recoveryKey("u2:a1", "marca-a", null)), null);
  // Y el que sí corresponde conserva el brandId de su marca.
  assert.equal(loadRecovery(s, recoveryKey("u1:a1", "marca-a", null))?.draft.brandId, "marca-a");
});

test("los destinatarios del aviso se conservan al guardar y al reabrir", () => {
  const post = draftToPost({ ...borrador("marca-a"), notifyOnPublish: true, notifyMemberIds: ["t1"] }, null, "Jair");
  assert.deepEqual(post.notifyMemberIds, ["t1"]);
  const reabierto = draftFromPost(post as unknown as Parameters<typeof draftFromPost>[0], { brandId: "marca-a", assignee: "" });
  assert.deepEqual(reabierto.notifyMemberIds, ["t1"]);
});

test("un borrador recuperado sin destinatarios abre con la lista vacía", () => {
  const s = storage();
  const key = recoveryKey("u1:a1", "marca-a", null);
  const anterior: Partial<PostDraft> = borrador("marca-a");
  delete anterior.notifyMemberIds;
  s.setItem(key, JSON.stringify({ draft: anterior, savedAt: "2026-10-31T10:00:00.000Z" }));
  assert.deepEqual(loadRecovery(s, key)?.draft.notifyMemberIds, []);
});

test("hasRecovery sin navegador no se rompe", () => {
  assert.equal(hasRecovery("p1"), false);
});
