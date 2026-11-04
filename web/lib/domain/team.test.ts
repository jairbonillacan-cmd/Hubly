import assert from "node:assert/strict";
import { test } from "node:test";
import { selectTeamProductivity } from "./team";
import { post, task } from "./test-fixtures";
import type { ActivityEvent, TeamMember } from "../types";

const member = (overrides: Partial<TeamMember>): TeamMember => ({
  id: "tm-1",
  name: "Jair",
  initials: "JA",
  avatarInitial: "J",
  avatarColor: "#4F46E5",
  role: "Dueño",
  email: "hola@agencia.demo",
  status: "Activo",
  baseActiveMinutes: 1,
  brandIds: ["a"],
  brandsCount: 1,
  tasksCompleted: 0,
  tasksInProgress: 0,
  postsPublished: 0,
  activeTimeLabel: "menos de un minuto",
  points: 0,
  ...overrides,
});

const event = (overrides: Partial<ActivityEvent>): ActivityEvent => ({
  id: "ev-1",
  memberId: "tm-1",
  type: "task_completed",
  brandId: "a",
  timestamp: "2026-10-31T15:00:00Z",
  durationMinutes: 30,
  ...overrides,
});

test("selectTeamProductivity calcula métricas reales de tareas, posts, tiempo activo y ciclo medio", () => {
  const members = [
    member({ id: "tm-1", name: "Jair", baseActiveMinutes: 1 }),
    member({
      id: "tm-2",
      name: "Lucía Ramírez",
      email: "lucia@agencia.demo",
      role: "Diseño",
      baseActiveMinutes: 120,
      tasksCompleted: 2,
      tasksInProgress: 1,
      postsPublished: 1,
    }),
  ];

  const tasks = [
    task({ id: "t-1", assigneeId: "tm-1", assigneeName: "Jair", completed: true, status: "done" as never }),
    task({ id: "t-2", assigneeId: "tm-1", assigneeName: "Jair", completed: false, status: "in_progress" as never }),
    task({ id: "t-3", assigneeId: "tm-2", assigneeName: "Lucía Ramírez", completed: true, status: "done" as never }),
  ];

  const posts = [
    post({ id: "p-1", authorId: "tm-1", assignee: "Jair", status: "published" }),
    post({ id: "p-2", authorId: "tm-1", assignee: "Jair", status: "pending" }),
  ];

  const events = [
    event({ id: "ev-1", memberId: "tm-1", type: "task_completed", durationMinutes: 35 }),
    // Una aprobación en lote no debe contarse como post publicado del miembro
    event({
      id: "ev-2",
      memberId: "tm-1",
      type: "post_published",
      durationMinutes: 10,
      metadata: { batchApprovedBy: "tm-1" },
    }),
  ];

  const result = selectTeamProductivity(members, tasks, posts, events, "30d", "", false);

  const jair = result.members.find((m) => m.id === "tm-1")!;
  assert.equal(jair.completedTasksCount, 2);
  assert.equal(jair.inProgressTasksCount, 1);
  assert.equal(jair.publishedPostsCount, 1);
  assert.equal(jair.submittedPostsCount, 1);
  // 1 base + (2 tareas * 18) + (45 - 1 de eventos) = 81m
  assert.equal(jair.activeMinutes, 81);
  assert.equal(jair.activeTimeFormatted, "1h 21m");
  assert.equal(jair.avgCycleMinutes, 41);
  assert.equal(jair.avgCycleFormatted, "41m");

  // Sin campos de gamificación ni logros inventados
  assert.equal("xp" in jair, false);
  assert.equal("level" in jair, false);
  assert.equal("streakDays" in jair, false);
  assert.equal("achievements" in jair, false);
});

test("selectTeamProductivity ordena el ranking por entregas completadas, luego tiempo activo y luego ciclo medio", () => {
  const members = [
    member({
      id: "tm-lento",
      name: "Carlos",
      email: "carlos@agencia.demo",
      baseActiveMinutes: 100,
      tasksCompleted: 1,
      postsPublished: 2, // 3 entregas, 100m activos, ciclo 100m
    }),
    member({
      id: "tm-lider",
      name: "Lucía",
      email: "lucia@agencia.demo",
      baseActiveMinutes: 90,
      tasksCompleted: 3,
      postsPublished: 2, // 5 entregas
    }),
    member({
      id: "tm-rapido",
      name: "Ana",
      email: "ana@agencia.demo",
      baseActiveMinutes: 100,
      tasksCompleted: 2,
      postsPublished: 1, // 3 entregas, 100m activos, ciclo 50m (< 100m)
    }),
    member({
      id: "tm-menos-tiempo",
      name: "Diego",
      email: "diego@agencia.demo",
      baseActiveMinutes: 60,
      tasksCompleted: 2,
      postsPublished: 1, // 3 entregas, 60m activos (< 100m)
    }),
  ];

  const result = selectTeamProductivity(members, [], [], [], "30d", "", true);

  assert.deepEqual(
    result.ranking.map((m) => m.id),
    ["tm-lider", "tm-rapido", "tm-lento", "tm-menos-tiempo"]
  );
  assert.deepEqual(
    result.ranking.map((m) => m.rankPosition),
    [1, 2, 3, 4]
  );

  // Las posiciones de ranking se propagan a la lista general de miembros
  const diego = result.members.find((m) => m.id === "tm-menos-tiempo")!;
  assert.equal(diego.rankPosition, 4);
});

test("selectTeamProductivity filtra miembros por búsqueda sin perder el ranking completo", () => {
  const members = [
    member({ id: "tm-1", name: "Jair", role: "Dueño", tasksCompleted: 1 }),
    member({ id: "tm-2", name: "Lucía Ramírez", role: "Diseño", email: "lucia@agencia.demo", tasksCompleted: 4 }),
  ];

  const result = selectTeamProductivity(members, [], [], [], "7d", "diseño", true);

  assert.equal(result.totalMembersCount, 2);
  assert.equal(result.ranking.length, 2);
  assert.deepEqual(
    result.members.map((m) => m.id),
    ["tm-2"]
  );
  assert.equal(result.members[0].rankPosition, 1);
});
