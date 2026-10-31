import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dueLabelFor, localIsoDate } from "../lib/date";
import { notebookPlainText, notebookTasks, notebookToHtml } from "../lib/notebook-content";
import { buildCaptionSystemPrompt } from "../lib/ai-caption";
import { buildMonthlyReport } from "../lib/reporting";
import { safeNextPath } from "../lib/supabase/config";
import type { SocialPost } from "../lib/types";
import { moveInList } from "../lib/use-kanban-drag";

test("localIsoDate usa la fecha local", () => {
  assert.equal(localIsoDate(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("addDays cruza meses", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("dueLabelFor describe fechas relativas", () => {
  const today = "2026-10-30";
  assert.equal(dueLabelFor("2026-10-30", today), "Hoy");
  assert.equal(dueLabelFor("2026-10-31", today), "Mañana");
  assert.equal(dueLabelFor("2026-10-29", today), "Ayer");
  assert.equal(dueLabelFor("2026-10-27", today), "Hace 3 días");
  assert.equal(dueLabelFor("2026-11-02", today), "En 3 días");
  assert.equal(dueLabelFor("", today), "Sin fecha");
});

test("moveInList reordena y aplica el cambio", () => {
  const list = [{ id: "a", s: 1 }, { id: "b", s: 1 }, { id: "c", s: 1 }];
  const before = moveInList(list, "c", "a", (x) => ({ ...x, s: 2 }));
  assert.deepEqual(before.map((x) => x.id), ["c", "a", "b"]);
  assert.equal(before[0].s, 2);
  assert.deepEqual(moveInList(list, "a", null, (x) => x).map((x) => x.id), ["b", "c", "a"]);
  assert.equal(moveInList(list, "zzz", null, (x) => x), list);
  assert.equal(moveInList(list, "a", "a", (x) => x), list);
});

test("notebookToHtml escapa texto plano y respeta HTML", () => {
  assert.equal(notebookToHtml("a < b\nc"), "<p>a &lt; b</p><p>c</p>");
  assert.equal(notebookToHtml("<p>hola</p>"), "<p>hola</p>");
  assert.equal(notebookToHtml(""), "");
});

test("notebookPlainText ignora las etiquetas", () => {
  assert.equal(notebookPlainText("<p>uno</p><p></p><ul><li>dos</li></ul>"), "uno dos");
  assert.equal(notebookPlainText("<p></p>"), "");
});

test("notebookTasks devuelve solo pendientes de listas de tareas", () => {
  const html =
    '<p>nota</p><ul data-type="taskList">' +
    '<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Pedir fotos</p></div></li>' +
    '<li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>Hecha</p></div></li>' +
    '<li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Con &amp; signo</p></div></li>' +
    "</ul><ul><li>viñeta normal</li></ul>";
  assert.deepEqual(notebookTasks(html), ["Pedir fotos", "Con & signo"]);
});

test("safeNextPath bloquea redirecciones externas", () => {
  assert.equal(safeNextPath("/crm?x=1"), "/crm?x=1");
  assert.equal(safeNextPath("//evil.com"), "/dashboard");
  assert.equal(safeNextPath("https://evil.com"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.com"), "/dashboard");
  assert.equal(safeNextPath(null, "/onboarding"), "/onboarding");
});

test("buildMonthlyReport solo cuenta publicados medidos del mes", () => {
  const base = { brandId: "b", networks: ["Instagram"], comments: [] } as unknown as SocialPost;
  const metrics = { reach: 100, likes: 10, comments: 5, saves: 2, shares: 5 };
  const posts = [
    { ...base, id: "1", scheduledDate: "2026-11-02", status: "published", network: "Instagram", metrics },
    { ...base, id: "2", scheduledDate: "2026-11-03", status: "published", network: "TikTok" },
    { ...base, id: "3", scheduledDate: "2026-11-04", status: "pending", metrics },
    { ...base, id: "4", scheduledDate: "2026-12-01", status: "published", metrics },
  ] as SocialPost[];
  const r = buildMonthlyReport(posts, "2026-11");
  assert.equal(r.planned, 3);
  assert.equal(r.published, 2);
  assert.equal(r.measured, 1);
  assert.equal(r.reach, 100);
  assert.equal(r.interactions, 20);
  assert.equal(r.engagementRate, 20);
  assert.deepEqual(r.byNetwork.map((n) => n.network), ["Instagram", "TikTok"]);
  assert.equal(buildMonthlyReport([], "2026-11").engagementRate, null);
});

test("el prompt de IA incluye la voz de la marca y limita lo que recibe", () => {
  const p = buildCaptionSystemPrompt({ name: "Sol", toneOfVoice: "cercano", dontWords: ["barato"] }, "Instagram", "Reel");
  assert.match(p, /Marca: Sol/);
  assert.match(p, /Tono de voz: cercano/);
  assert.match(p, /evita: barato/);
  assert.match(p, /No inventes/);
  assert.ok(buildCaptionSystemPrompt({ name: "x".repeat(5000) }).length < 1000);
});
