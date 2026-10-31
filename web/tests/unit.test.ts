import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dueLabelFor, localIsoDate } from "../lib/date";
import { notebookPlainText, notebookTasks, notebookToHtml } from "../lib/notebook-content";
import { safeNextPath } from "../lib/supabase/config";
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
