import assert from "node:assert/strict";
import { test } from "node:test";
import { duplicatePostAsDraft, selectTodayPostsAndApprovals, withPostLog } from "./posts";
import { post as selectorPost, RELOJ } from "./test-fixtures";
import type { SocialPost } from "../types";

const post = (overrides: Partial<SocialPost> = {}): SocialPost =>
  ({
    id: "p-1",
    brandId: "brand-a",
    title: "Post original",
    caption: "Hola",
    networks: ["Instagram"],
    format: "Imagen",
    scheduledDate: "2026-11-10",
    scheduledTime: "09:00",
    status: "approved",
    statusLabel: "Aprobado",
    assignee: "Jair",
    pillar: "Contenido",
    comments: [{ id: "c-1", author: "Ana", role: "client", text: "Bien", createdAt: "Hoy" }],
    metrics: { likes: 10 },
    activity: [{ id: "a-1", author: "Ana", text: "Comentó", at: "Hoy" }],
    ...overrides,
  }) as SocialPost;

test("withPostLog pone la entrada nueva delante y no toca el resto", () => {
  const conLog = withPostLog(post({ activity: [] }), "Cambió algo", "Jair");
  const entradas = conLog.activity ?? [];
  assert.equal(entradas.length, 1);
  assert.equal(entradas[0].text, "Cambió algo");
  assert.equal(entradas[0].author, "Jair");
  assert.equal(conLog.title, "Post original");
});

test("duplicatePostAsDraft deja un borrador limpio con su registro", () => {
  const copia = duplicatePostAsDraft(post(), "p-2", "Jair");
  assert.equal(copia.id, "p-2");
  assert.equal(copia.title, "Post original (copia)");
  assert.equal(copia.status, "draft");
  assert.equal(copia.statusLabel, "Borrador");
  assert.equal(copia.scheduledDate, "");
  assert.equal(copia.scheduledTime, "");
  assert.deepEqual(copia.comments, []);
  assert.equal(copia.metrics, undefined);
  assert.equal(copia.publishedUrl, undefined);
  const actividad = copia.activity ?? [];
  assert.equal(actividad.length, 1);
  assert.match(actividad[0].text, /Duplicó «Post original»/);
});

// Pruebas del selector que ahora vive aquí
test("los posts de hoy no dejan pasar posts de otra marca ni borradores", () => {
  const posts = [
    selectorPost({ id: "hoy-a", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "09:00" }),
    selectorPost({ id: "hoy-a-tarde", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "14:00" }),
    selectorPost({ id: "otra-marca", brandId: "b", scheduledDate: "2026-10-31", scheduledTime: "08:00" }),
    selectorPost({ id: "borrador", brandId: "a", scheduledDate: "2026-10-31", status: "draft" }),
  ];
  const r = selectTodayPostsAndApprovals(posts, "a", RELOJ);
  assert.deepEqual(r.todayPosts.map((p) => p.id), ["hoy-a", "hoy-a-tarde"]);
  assert.equal(r.todayCount, 2);
  assert.equal(r.isEmptyToday, false);
});

test("los posts sin fecha no son de hoy pero sí pueden estar en aprobación", () => {
  const posts = [selectorPost({ id: "sin-fecha", scheduledDate: "", status: "pending" })];
  const r = selectTodayPostsAndApprovals(posts, "a", RELOJ);
  assert.equal(r.isEmptyToday, true);
  assert.deepEqual(r.approvalPosts.map((p) => p.id), ["sin-fecha"]);
});

test("con listas vacías los contadores de posts quedan en cero", () => {
  const r = selectTodayPostsAndApprovals([], "a", RELOJ);
  assert.equal(r.isEmptyToday, true);
  assert.equal(r.isEmptyApprovals, true);
  assert.deepEqual(r.changesRequestedPosts, []);
});
