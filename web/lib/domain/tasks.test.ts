import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTask, mergeTaskPatch, toggleTaskState, type AddTaskInput } from "./tasks";
import type { AgencyTask, BrandWorkspace, TeamMember } from "../types";

const brand = { id: "brand-a", name: "Café Bruma" } as BrandWorkspace;
const team = [
  { id: "tm-1", name: "Jair" },
  { id: "tm-2", name: "Ana" },
] as TeamMember[];

const input = (overrides: Partial<AddTaskInput> = {}): AddTaskInput =>
  ({ brandId: "brand-a", title: "Revisar parrilla", ...overrides }) as AddTaskInput;

const task = (overrides: Partial<AgencyTask> = {}): AgencyTask =>
  ({
    id: "t-1",
    brandId: "brand-a",
    title: "Tarea",
    dueLabel: "Hoy",
    dueDate: "2026-11-03",
    assignee: "Jair",
    assigneeId: "tm-1",
    assigneeName: "Jair",
    assigneeInitial: "J",
    listName: "General",
    status: "todo",
    priority: "media",
    completed: false,
    tags: [],
    ...overrides,
  }) as AgencyTask;

test("buildTask resuelve responsable, etiquetas y estado por defecto", () => {
  const creada = buildTask(input({ assignee: "Ana" }), {
    id: "task-1",
    brands: [brand],
    team,
    profileName: "Jair",
  });
  assert.equal(creada.id, "task-1");
  assert.equal(creada.assigneeName, "Ana");
  assert.equal(creada.assigneeId, "tm-2");
  assert.equal(creada.assigneeInitial, "A");
  assert.deepEqual(creada.tags, ["Café Bruma", "Primeros pasos"]);
  assert.equal(creada.dueBucket, "today");
  assert.equal(creada.completed, false);
});

test("buildTask sin equipo conocido cae en tm-1 y toma las etiquetas que le den", () => {
  const creada = buildTask(input({ assignee: "Nadie", tags: ["Ads"] }), {
    id: "task-2",
    brands: [],
    team: [],
  });
  assert.equal(creada.assigneeId, "tm-1");
  assert.equal(creada.assigneeName, "Nadie");
  assert.equal(creada.assigneeInitial, "N");
  assert.deepEqual(creada.tags, ["Ads"]);
});

test("buildTask marca completada si el estado ya lo dice", () => {
  const creada = buildTask(input({ status: "done" }), { id: "task-3", brands: [], team: [] });
  assert.equal(creada.completed, true);
});

test("mergeTaskPatch no deja status y completed contradiciéndose", () => {
  const completada = mergeTaskPatch(task(), { completed: true });
  assert.equal(completada.completed, true);
  assert.equal(completada.status, "done");

  const reabierta = mergeTaskPatch(task({ completed: true, status: "done" }), { completed: false });
  assert.equal(reabierta.completed, false);
  assert.equal(reabierta.status, "todo");

  const soloEstado = mergeTaskPatch(task(), { status: "in_progress" });
  assert.equal(soloEstado.completed, false);
  assert.equal(soloEstado.status, "in_progress");
});

test("toggleTaskState cierra la tarea y, al reabrirla, vuelve a «Hoy»", () => {
  const cerrada = toggleTaskState(task(), "2026-11-03T12:00:00.000Z");
  assert.equal(cerrada.becameDone, true);
  assert.equal(cerrada.task.completed, true);
  assert.equal(cerrada.task.status, "done");
  assert.equal(cerrada.task.completedAt, "2026-11-03T12:00:00.000Z");
  assert.equal(cerrada.task.dueLabel, "Completada");

  const abierta = toggleTaskState(cerrada.task, "2026-11-04T12:00:00.000Z");
  assert.equal(abierta.becameDone, false);
  assert.equal(abierta.task.completed, false);
  assert.equal(abierta.task.status, "todo");
  assert.equal(abierta.task.completedAt, undefined);
  assert.equal(abierta.task.dueLabel, "Hoy");
});
