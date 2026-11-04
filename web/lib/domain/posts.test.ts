import assert from "node:assert/strict";
import { test } from "node:test";
import { duplicatePostAsDraft, withPostLog } from "./posts";
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
