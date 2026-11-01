import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGENT_TEMPLATES,
  answerAgent,
  applyTemplate,
  createAgent,
  duplicateAgent,
  isBlankAgent,
  startFromScratch,
} from "./agents";

test("un agente nuevo está en blanco hasta que se configura", () => {
  const agent = createAgent();
  assert.equal(isBlankAgent(agent), true);
  assert.equal(isBlankAgent({ ...agent, ...startFromScratch(agent) }), false);
  assert.equal(isBlankAgent({ ...agent, name: "Reporte" }), false);
});

test("una plantilla deja el agente configurado", () => {
  const template = AGENT_TEMPLATES[0];
  const agent = { ...createAgent(), ...applyTemplate(createAgent(), template) };
  assert.equal(agent.name, template.name);
  assert.equal(agent.purpose, template.purpose);
  assert.equal(agent.cadence, template.cadence);
  assert.deepEqual(agent.messages.map((m) => m.role), ["user", "hubi"]);
});

test("desde cero pregunta qué hace, luego cuándo, y después anota ajustes", () => {
  let agent = createAgent();
  agent = { ...agent, ...answerAgent(agent, "  Avisar de posts sin aprobar ") };
  assert.equal(agent.purpose, "Avisar de posts sin aprobar");
  assert.equal(agent.cadence, "");

  agent = { ...agent, ...answerAgent(agent, "Cada lunes") };
  assert.equal(agent.cadence, "Cada lunes");
  assert.match(agent.messages.at(-1)!.text, /Avisar de posts sin aprobar/);

  agent = { ...agent, ...answerAgent(agent, "Solo de Café Bruma") };
  assert.deepEqual(agent.notes, ["Solo de Café Bruma"]);
});

test("un mensaje vacío no cambia nada", () => {
  assert.deepEqual(answerAgent(createAgent(), "   "), {});
});

test("duplicar conserva la configuración con otro id", () => {
  const original = { ...createAgent(), name: "Reporte", purpose: "Resumir", cadence: "Cada mes" };
  const copy = duplicateAgent(original);
  assert.notEqual(copy.id, original.id);
  assert.equal(copy.name, "Reporte (copia)");
  assert.equal(copy.purpose, "Resumir");
});

test("los ids de plantilla no se repiten", () => {
  assert.equal(new Set(AGENT_TEMPLATES.map((t) => t.id)).size, AGENT_TEMPLATES.length);
});
