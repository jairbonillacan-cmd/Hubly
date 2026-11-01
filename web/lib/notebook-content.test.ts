import assert from "node:assert/strict";
import { test } from "node:test";
import { notebookPlainText, notebookTasks, notebookToHtml } from "./notebook-content";

test("contenido vacío y corrupto no rompen", () => {
  assert.equal(notebookToHtml(""), "");
  assert.equal(notebookPlainText(""), "");
  assert.deepEqual(notebookTasks(""), []);
  assert.deepEqual(notebookTasks("texto suelto sin html"), []);
  assert.deepEqual(notebookTasks("<ul><li>viñeta sin data-checked</li></ul>"), []);
  // Un notebook que ya empieza con un bloque pasa tal cual, aunque venga sin cerrar.
  assert.equal(notebookToHtml("<p>sin cerrar"), "<p>sin cerrar");
});

test("el texto plano no puede inyectar HTML ni scripts al convertirlo", () => {
  assert.equal(
    notebookToHtml("<script>alert(1)</script>"),
    "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
  );
  assert.equal(
    notebookToHtml('<img src=x onerror="alert(1)">'),
    '<p>&lt;img src=x onerror="alert(1)"&gt;</p>'
  );
  const html = notebookToHtml("hola <b>mundo</b>");
  assert.ok(!html.includes("<b>"));
  assert.equal(notebookPlainText("<script>alert(1)</script>"), "alert(1)");
  assert.ok(!notebookPlainText("<script>x</script>").includes("<script>"));
});

test("los pendientes sobreviven entidades y etiquetas anidadas", () => {
  assert.deepEqual(
    notebookTasks(
      '<ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"></label><div><p>Responder a &quot;Ana&quot;</p></div></li></ul>'
    ),
    ['Responder a "Ana"']
  );
  assert.deepEqual(
    notebookTasks('<ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"></label><div><p>   </p></div></li></ul>'),
    []
  );
});
