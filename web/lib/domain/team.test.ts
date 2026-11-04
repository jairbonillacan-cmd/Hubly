import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTeamActivityRows,
  buildTeamRankingRows,
  computeToggledMemberBrandIds,
  findNextPendingMemberTask,
  resolveMemberAssignedBrands,
  selectTeamProductivity,
  syncTeamWithProfile,
} from "./team";
import { brand, post, task } from "./test-fixtures";
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

test("syncTeamWithProfile sincroniza nombre, inicial y rol del miembro principal", () => {
  const members = [
    member({ id: "tm-1", name: "Jair", avatarInitial: "J", role: "Dueño" }),
    member({ id: "tm-2", name: "Lucía", avatarInitial: "L", role: "Diseño" }),
  ];
  const synced = syncTeamWithProfile(members, {
    name: "Jair Morales",
    avatarInitial: "M",
    role: "Director",
  });
  assert.equal(synced[0].name, "Jair Morales");
  assert.equal(synced[0].avatarInitial, "M");
  assert.equal(synced[0].role, "Director");
  assert.equal(synced[1].name, "Lucía");
});

test("buildTeamRankingRows agrega deliverablesCount a cada fila del ranking", () => {
  const { ranking } = selectTeamProductivity(
    [member({ id: "tm-1", tasksCompleted: 3, postsPublished: 2 })],
    [],
    [],
    [],
    "30d",
    "",
    true
  );
  const rows = buildTeamRankingRows(ranking);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].deliverablesCount, 5);
});

test("resolveMemberAssignedBrands y computeToggledMemberBrandIds respetan la marca activa y evitan lista vacía", () => {
  const b1 = brand({ id: "b-1", name: "Café Bruma" });
  const b2 = brand({ id: "b-2", name: "Clínica Norte" });
  const brands = [b1, b2];

  const initialOwnerBrands = resolveMemberAssignedBrands({
    isPrimaryOwner: true,
    hasCustomizedOwnerBrands: false,
    memberBrandIds: ["b-1", "b-2"],
    brands,
    activeBrand: b2,
  });
  assert.deepEqual(initialOwnerBrands.map((b) => b.id), ["b-2"]);

  // No permite quitar la única marca activa
  const emptyAttempt = computeToggledMemberBrandIds({
    isPrimaryOwner: true,
    hasCustomizedOwnerBrands: false,
    memberBrandIds: ["b-2"],
    activeBrandId: "b-2",
    brandId: "b-2",
  });
  assert.equal(emptyAttempt, null);

  // Permite añadir otra marca y luego reflejar la selección personalizada
  const added = computeToggledMemberBrandIds({
    isPrimaryOwner: true,
    hasCustomizedOwnerBrands: false,
    memberBrandIds: ["b-2"],
    activeBrandId: "b-2",
    brandId: "b-1",
  });
  assert.deepEqual(added, ["b-2", "b-1"]);

  const customizedOwnerBrands = resolveMemberAssignedBrands({
    isPrimaryOwner: true,
    hasCustomizedOwnerBrands: true,
    memberBrandIds: added ?? undefined,
    brands,
    activeBrand: b2,
  });
  assert.deepEqual(customizedOwnerBrands.map((b) => b.id), ["b-1", "b-2"]);
});

test("buildTeamActivityRows construye filas semanales con Hoy al final y desglose mensual en 4 semanas", () => {
  const { activeMember } = selectTeamProductivity(
    [member({ id: "tm-2", name: "Lucía", baseActiveMinutes: 100 })],
    [],
    [],
    [],
    "30d",
    "",
    true
  );

  const weekly = buildTeamActivityRows("Semana", activeMember.weeklyActivity, activeMember.activeMinutes);
  assert.equal(weekly.length, 4);
  assert.equal(weekly[weekly.length - 1].label, "Hoy");
  assert.equal(weekly[0].statusLabel, "85m");

  const monthly = buildTeamActivityRows("Mes", activeMember.weeklyActivity, 100);
  assert.equal(monthly.length, 4);
  assert.deepEqual(monthly.map((r) => r.minutes), [20, 25, 25, 30]);
  assert.equal(monthly[3].label, "Semana actual");
});

test("findNextPendingMemberTask prioriza tareas del miembro activo y cae en la primera pendiente", () => {
  const tDone = task({ id: "t-done", assigneeId: "tm-2", assignee: "Lucía", status: "done" as never, completed: true });
  const tOther = task({ id: "t-other", assigneeId: "tm-1", assignee: "Jair", status: "in_progress" as never, completed: false });
  const tMine = task({ id: "t-mine", assigneeId: "tm-2", assignee: "Lucía", status: "in_progress" as never, completed: false });

  assert.equal(findNextPendingMemberTask([tDone, tOther, tMine], "tm-2", "Lucía")?.id, "t-mine");
  assert.equal(findNextPendingMemberTask([tDone, tOther], "tm-2", "Lucía")?.id, "t-other");
});
