import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDaysToIsoDate,
  resolveDateInTimezone,
  sanitizeTimezone,
  selectAccountRecommendations,
  selectAccountsHealth,
  selectGreetingAndDate,
  selectOnboardingStatus,
  selectTasksBreakdown,
  selectTodayPostsAndApprovals,
} from "./domain-selectors";
import { selectActiveBrand } from "./active-brand";
import type { BrandWorkspace, PostItem, TaskItem } from "./types";

const task = (overrides: Partial<TaskItem>): TaskItem =>
  ({
    id: "t",
    title: "Tarea",
    brandId: "a",
    dueLabel: "",
    dueDate: "2026-10-31",
    assignee: "Ana",
    assigneeId: "tm-2",
    assigneeName: "Ana",
    assigneeInitial: "A",
    listName: "General",
    status: "pendiente",
    priority: "media",
    completed: false,
    tags: [],
    ...overrides,
  }) as TaskItem;

const post = (overrides: Partial<PostItem>): PostItem =>
  ({
    id: "p",
    brandId: "a",
    title: "Post",
    caption: "",
    networks: ["Instagram"],
    format: "Imagen",
    scheduledDate: "2026-10-31",
    scheduledTime: "10:00",
    status: "approved",
    assignee: "Ana",
    pillar: "Contenido",
    comments: [],
    ...overrides,
  }) as unknown as PostItem;

const brand = (overrides: Partial<BrandWorkspace>): BrandWorkspace =>
  ({
    id: "a",
    name: "Marca A",
    slug: "marca-a",
    handle: "@a",
    shareToken: "tk",
    initials: "MA",
    initial: "M",
    color: "#000",
    avatarBg: "#fff",
    avatarColor: "#000",
    industry: "Moda",
    city: "CDMX",
    connectedNetworks: [],
    Networks: [],
    monthlyPostTarget: 12,
    monthlyBudget: 0,
    adBudget: 0,
    hasPaidAds: false,
    paidAdsLabel: "sin pauta",
    healthStatus: "en_progreso",
    healthScore: 50,
    commitments: { hasDeclaredCommitments: false },
    ...overrides,
  }) as unknown as BrandWorkspace;

const RELOJ = "2026-10-31T18:00:00Z"; // 12:00 en America/Mexico_City

test("sanitizeTimezone cae a Ciudad de México con zonas inválidas", () => {
  assert.equal(sanitizeTimezone(null), "America/Mexico_City");
  assert.equal(sanitizeTimezone(""), "America/Mexico_City");
  assert.equal(sanitizeTimezone("Planeta/Marte"), "America/Mexico_City");
  assert.equal(sanitizeTimezone("America/Santiago"), "America/Santiago");
});

test("el día en Ciudad de México cambia a medianoche y no antes", () => {
  const antes = resolveDateInTimezone("2026-11-01T05:59:00Z", "America/Mexico_City");
  assert.equal(antes.isoDate, "2026-10-31");
  assert.equal(antes.day, 31);
  assert.equal(antes.month, 10);
  assert.equal(antes.year, 2026);
  const mediaNoche = resolveDateInTimezone("2026-11-01T06:00:00Z", "America/Mexico_City");
  assert.equal(mediaNoche.isoDate, "2026-11-01");
  assert.equal(mediaNoche.hour, 0);
});

test("dateTitleCase da el día con mayúscula y el mes en minúscula", () => {
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-10-31T18:00:00Z").dateTitleCase,
    "Sábado, 31 de octubre"
  );
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-04-19T15:00:00Z").dateTitleCase,
    "Domingo, 19 de abril"
  );
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-04-19T15:00:00Z").dateFormatted,
    "domingo, 19 de abril"
  );
});

test("addDaysToIsoDate cruza meses, años y bisiestos", () => {
  assert.equal(addDaysToIsoDate("2026-10-31", 1), "2026-11-01");
  assert.equal(addDaysToIsoDate("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysToIsoDate("2024-02-28", 1), "2024-02-29");
  assert.equal(addDaysToIsoDate("2026-02-28", 1), "2026-03-01");
});

test("las tareas se reparten por vencimiento y no cruzan entre marcas", () => {
  const tasks = [
    task({ id: "vencida", dueDate: "2026-10-30", brandId: "a" }),
    task({ id: "hoy", dueDate: "2026-10-31", brandId: "a" }),
    task({ id: "manana", dueDate: "2026-11-01", brandId: "a" }),
    task({ id: "proxima", dueDate: "2026-12-01", brandId: "a" }),
    task({ id: "otra-marca", dueDate: "2026-10-31", brandId: "b" }),
    task({ id: "hecha", dueDate: "2026-10-30", status: "done" as never, completed: true, brandId: "a" }),
  ];
  const r = selectTasksBreakdown(tasks, "a", true, RELOJ);
  assert.deepEqual(r.ATRASADAS.map((t) => t.id), ["vencida"]);
  assert.deepEqual(r.HOY.map((t) => t.id), ["hoy"]);
  assert.deepEqual(r.MAÑANA.map((t) => t.id), ["manana"]);
  assert.deepEqual(r.PRÓXIMAS.map((t) => t.id), ["proxima"]);
  assert.equal(r.pendingCount, 4);
  assert.equal(r.completedCount, 1);
  assert.equal(r.totalCount, 5);
  assert.equal(r.todayIso, "2026-10-31");
  assert.equal(r.tomorrowIso, "2026-11-01");
  assert.ok(!JSON.stringify(r.pendingTasks.map((t) => t.id)).includes("otra-marca"));
});

test("sin tareas el desglose queda en ceros", () => {
  const r = selectTasksBreakdown([], "a", true, RELOJ);
  assert.equal(r.pendingCount, 0);
  assert.equal(r.completedCount, 0);
  assert.equal(r.totalCount, 0);
  assert.equal(r.pendingLabel, "0 pendientes");
  assert.equal(r.pendingSentence, "Tienes 0 pendientes.");
  assert.deepEqual(r.groups.map((g) => g.tasks.length), [0, 0, 0, 0]);
});

test("los posts de hoy no dejan pasar posts de otra marca ni borradores", () => {
  const posts = [
    post({ id: "hoy-a", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "09:00" }),
    post({ id: "hoy-a-tarde", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "14:00" }),
    post({ id: "otra-marca", brandId: "b", scheduledDate: "2026-10-31", scheduledTime: "08:00" }),
    post({ id: "borrador", brandId: "a", scheduledDate: "2026-10-31", status: "draft" }),
  ];
  const r = selectTodayPostsAndApprovals(posts, "a", RELOJ);
  assert.deepEqual(r.todayPosts.map((p) => p.id), ["hoy-a", "hoy-a-tarde"]);
  assert.equal(r.todayCount, 2);
  assert.equal(r.isEmptyToday, false);
});

test("los posts sin fecha no son de hoy pero sí pueden estar en aprobación", () => {
  const posts = [post({ id: "sin-fecha", scheduledDate: "", status: "pending" })];
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

test("la salud de cuentas evalúa cada marca con sus propios datos", () => {
  const brands = [
    brand({ id: "a", name: "Marca A" }),
    brand({ id: "b", name: "Marca B", archived: true }),
  ];
  const tasks = [task({ id: "v-a1", brandId: "a", dueDate: "2026-10-30" }), task({ id: "v-a2", brandId: "a", dueDate: "2026-10-29" })];
  const posts = [post({ id: "p-a", brandId: "a", status: "pending" })];
  const r = selectAccountsHealth(brands, tasks, posts, { referenceNow: RELOJ });
  assert.equal(r.summary.totalAccounts, 1); // la archivada no entra
  const cuenta = r.accounts[0];
  assert.equal(cuenta.id, "a");
  assert.equal(cuenta.overdueTasksCount, 2);
  assert.equal(cuenta.pendingApprovalsCount, 1);
  assert.ok(Number.isFinite(cuenta.fulfillmentPercent));
  assert.ok(Number.isFinite(cuenta.computedHealthScore));
});

test("una marca sin datos de compromisos sigue recibiendo porcentajes finitos", () => {
  const r = selectAccountsHealth([brand({ id: "vacia" })], [], [], { referenceNow: RELOJ });
  const cuenta = r.accounts[0];
  assert.ok(Number.isFinite(cuenta.fulfillmentPercent));
  assert.ok(Number.isFinite(cuenta.computedHealthScore));
  for (const d of cuenta.deliverables) {
    assert.ok(Number.isFinite(d.percent), `percent de ${d.key} no es finito`);
    assert.ok(d.percent >= 0 && d.percent <= 100);
  }
});

test("compromisos en cero: porcentajes definidos, sin NaN", () => {
  const enCeros = brand({
    id: "cero",
    commitments: {
      postsCommitted: 0, postsCompleted: 0,
      storiesCommitted: 0, storiesCompleted: 0,
      reelsCommitted: 0, reelsCompleted: 0,
      adCampaignsCommitted: 0, adCampaignsCompleted: 0,
      hasDeclaredCommitments: true,
    },
  } as Partial<BrandWorkspace>);
  const r = selectAccountsHealth([enCeros], [], [], { referenceNow: RELOJ });
  const cuenta = r.accounts[0];
  assert.equal(cuenta.totalCommitted, 0);
  assert.equal(cuenta.fulfillmentPercent, 0);
  for (const d of cuenta.deliverables) {
    assert.ok(Number.isFinite(d.percent));
  }
});

test("sin marcas el resumen de salud queda en ceros", () => {
  const r = selectAccountsHealth([], [], [], { referenceNow: RELOJ });
  assert.equal(r.accounts.length, 0);
  assert.equal(r.summary.totalAccounts, 0);
  assert.equal(r.summary.averageHealthScore, 0);
});

test("una marca sin compromisos declarados no genera recomendaciones", () => {
  const r = selectAccountRecommendations(
    [brand({ id: "a", commitments: undefined as never })],
    [],
    []
  );
  assert.deepEqual(r, []);
});

test("el onboarding con estado vacío no avanza ni rompe", () => {
  const r = selectOnboardingStatus({});
  assert.equal(r.completedCount, 0);
  assert.equal(r.progressPercent, 0);
  assert.equal(r.totalCount, 4);
  assert.equal(r.dismissed, false);
});

test("la marca activa es la elegida, luego la primera sin archivar, luego la primera", () => {
  const lista = [
    brand({ id: "archivada", status: "archived" }),
    brand({ id: "min", status: "Activo" }),
    brand({ id: "bruma", status: "Activo" }),
  ];
  assert.equal(selectActiveBrand(lista, "bruma")?.id, "bruma");
  assert.equal(selectActiveBrand(lista, "no-existe")?.id, "min");
  assert.equal(selectActiveBrand(lista, null)?.id, "min");
  assert.equal(selectActiveBrand([brand({ id: "solo", status: "archived" })], "otra")?.id, "solo");
  assert.equal(selectActiveBrand([], "cualquiera"), undefined);
});
