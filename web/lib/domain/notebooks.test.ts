import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NOTEBOOK_COLORS,
  buildNotebookFormDraft,
  extractFreshNotebookTasks,
  resolveNextNotebookIdAfterDelete,
  resolveNotebookColorSpec,
  validateAndBuildNotebookInput,
} from "./notebooks";
import type { NotebookItem } from "../types";

const sampleNotebook: NotebookItem = {
  id: "nb-1",
  brandId: "brand-1",
  title: "Minuta mensual",
  subtitle: "Acuerdos con cliente",
  category: "ESTRATEGIA",
  content: "<p>Contenido inicial</p>",
  bgGradient: "",
  accentColor: "#4A7862",
  updatedAt: "2026-11-01T10:00:00.000Z",
  updatedBy: "Equipo",
  isPinned: false,
};

test("resolveNotebookColorSpec devuelve el color coincidente o Kraft por defecto", () => {
  assert.equal(resolveNotebookColorSpec("#4A7862").id, "sage");
  assert.equal(resolveNotebookColorSpec("#000000").id, NOTEBOOK_COLORS[0].id);
});

test("buildNotebookFormDraft inicializa borrador nuevo o carga la libreta existente", () => {
  const fresh = buildNotebookFormDraft(sampleNotebook, true, "brand-active");
  assert.equal(fresh.title, "");
  assert.equal(fresh.brandId, "brand-active");
  assert.equal(fresh.accentColor, "#C59B6D");

  const loaded = buildNotebookFormDraft(sampleNotebook, false, "brand-active");
  assert.equal(loaded.title, "Minuta mensual");
  assert.equal(loaded.brandId, "brand-1");
  assert.equal(loaded.accentColor, "#4A7862");
});

test("validateAndBuildNotebookInput exige título y contenido con texto visible", () => {
  const noTitle = validateAndBuildNotebookInput({
    title: "   ",
    subtitle: "",
    category: "",
    brandId: "brand-1",
    accentColor: "#C59B6D",
    content: "<p>Texto</p>",
  });
  assert.deepEqual(noTitle, {
    ok: false,
    field: "title",
    error: "Escribe un título para esta libreta Kraft.",
  });

  const emptyHtml = validateAndBuildNotebookInput({
    title: "Guía",
    subtitle: "",
    category: "",
    brandId: "brand-1",
    accentColor: "#C59B6D",
    content: "<p>   </p>",
  });
  assert.deepEqual(emptyHtml, {
    ok: false,
    field: "content",
    error: "Agrega contenido o notas a la libreta antes de guardar.",
  });

  const valid = validateAndBuildNotebookInput({
    title: "  Guía de marca  ",
    subtitle: "  ",
    category: " tono ",
    brandId: "brand-1",
    accentColor: "#C59B6D",
    content: "<p>Acuerdos</p>",
  });
  assert.deepEqual(valid, {
    ok: true,
    payload: {
      brandId: "brand-1",
      title: "Guía de marca",
      subtitle: "Notas operativas",
      category: "TONO",
      accentColor: "#C59B6D",
      content: "<p>Acuerdos</p>",
    },
  });
});

test("extractFreshNotebookTasks filtra pendientes ya existentes en la misma marca", () => {
  const html =
    '<ul data-type="taskList"><li data-checked="false"><label><input type="checkbox"></label><div><p>Pedir fotos</p></div></li><li data-checked="false"><label><input type="checkbox"></label><div><p>Enviar pauta</p></div></li><li data-checked="true"><label><input type="checkbox"></label><div><p>Hecha</p></div></li></ul>';
  const fresh = extractFreshNotebookTasks(
    html,
    [
      { brandId: "brand-1", title: "Pedir fotos" },
      { brandId: "brand-2", title: "Enviar pauta" },
    ],
    "brand-1"
  );
  assert.deepEqual(fresh, ["Enviar pauta"]);
});

test("resolveNextNotebookIdAfterDelete devuelve la primera restante o null", () => {
  assert.equal(
    resolveNextNotebookIdAfterDelete([{ id: "n1" }, { id: "n2" }], "n1"),
    "n2"
  );
  assert.equal(resolveNextNotebookIdAfterDelete([{ id: "n1" }], "n1"), null);
});
