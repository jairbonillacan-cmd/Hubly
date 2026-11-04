import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addMinutesToTime,
  buildAgendaMonthCells,
  buildAgendaWeekDays,
  buildCalendarEntries,
  countActiveCalendarFilters,
  duplicatePostAsDraft,
  expandActivityOccurrences,
  filterPostsByBrand,
  formatAgendaPeriodLabel,
  formatBrandBioUrl,
  groupEntriesByDay,
  parseParrillasTab,
  resolveBrandBioHandle,
  selectTodayPostsAndApprovals,
  shiftAgendaAnchor,
  withPostLog,
  type CalendarActivity,
} from "./posts";
import { post as selectorPost, RELOJ } from "./test-fixtures";
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

// Pruebas del selector que ahora vive aquí
test("los posts de hoy no dejan pasar posts de otra marca ni borradores", () => {
  const posts = [
    selectorPost({ id: "hoy-a", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "09:00" }),
    selectorPost({ id: "hoy-a-tarde", brandId: "a", scheduledDate: "2026-10-31", scheduledTime: "14:00" }),
    selectorPost({ id: "otra-marca", brandId: "b", scheduledDate: "2026-10-31", scheduledTime: "08:00" }),
    selectorPost({ id: "borrador", brandId: "a", scheduledDate: "2026-10-31", status: "draft" }),
  ];
  const r = selectTodayPostsAndApprovals(posts, "a", RELOJ);
  assert.deepEqual(r.todayPosts.map((p) => p.id), ["hoy-a", "hoy-a-tarde"]);
  assert.equal(r.todayCount, 2);
  assert.equal(r.isEmptyToday, false);
});

test("los posts sin fecha no son de hoy pero sí pueden estar en aprobación", () => {
  const posts = [selectorPost({ id: "sin-fecha", scheduledDate: "", status: "pending" })];
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

test("parseParrillasTab reconoce las pestañas válidas, el alias liga y descarta valores desconocidos", () => {
  assert.equal(parseParrillasTab("calendario"), "calendario");
  assert.equal(parseParrillasTab("ideas"), "ideas");
  assert.equal(parseParrillasTab("mensajes"), "mensajes");
  assert.equal(parseParrillasTab("analytics"), "analytics");
  assert.equal(parseParrillasTab("tableros"), "tableros");
  assert.equal(parseParrillasTab("reportes"), "reportes");
  assert.equal(parseParrillasTab("links"), "links");
  assert.equal(parseParrillasTab("liga"), "links");
  assert.equal(parseParrillasTab("invalida"), null);
  assert.equal(parseParrillasTab(null), null);
  assert.equal(parseParrillasTab(undefined), null);
});

test("resolveBrandBioHandle prioriza bioLink.handle sobre slug y devuelve cadena vacía sin marca", () => {
  assert.equal(resolveBrandBioHandle({ slug: "cafe-bruma", bioLink: { handle: "cafebruma" } }), "cafebruma");
  assert.equal(resolveBrandBioHandle({ slug: "cafe-bruma", bioLink: { handle: "" } }), "cafe-bruma");
  assert.equal(resolveBrandBioHandle({ slug: "cafe-bruma" }), "cafe-bruma");
  assert.equal(resolveBrandBioHandle(null), "");
});

test("formatBrandBioUrl construye la dirección pública sin duplicar la arroba", () => {
  assert.equal(formatBrandBioUrl("cafebruma"), "https://hubly.app/@cafebruma");
  assert.equal(formatBrandBioUrl("@cafebruma"), "https://hubly.app/@cafebruma");
  assert.equal(formatBrandBioUrl(""), "https://hubly.app/@");
});

test("filterPostsByBrand devuelve solo los posts de la marca activa", () => {
  const lista = [post({ id: "p-a", brandId: "brand-a" }), post({ id: "p-b", brandId: "brand-b" })];
  assert.deepEqual(filterPostsByBrand(lista, "brand-a").map((p) => p.id), ["p-a"]);
  assert.deepEqual(filterPostsByBrand(lista, "brand-c"), []);
  assert.deepEqual(filterPostsByBrand(lista, null), []);
});

test("expandActivityOccurrences expande repeticiones ninguna, semanal y mensual", () => {
  const base: CalendarActivity = {
    id: "act-1",
    brandId: "brand-a",
    isoDate: "2026-11-02",
    title: "Junta",
    category: "Junta",
    time: "09:00",
    repeat: "none",
  };
  assert.deepEqual(expandActivityOccurrences(base), ["2026-11-02"]);

  const semanal = expandActivityOccurrences({ ...base, repeat: "weekly" });
  assert.equal(semanal[0], "2026-11-02");
  assert.equal(semanal[1], "2026-11-09");
  assert.equal(semanal[2], "2026-11-16");

  const mensual = expandActivityOccurrences({ ...base, repeat: "monthly" });
  assert.equal(mensual.length, 24);
  assert.equal(mensual[0], "2026-11-02");
  assert.equal(mensual[1], "2026-12-02");
  assert.equal(mensual[2], "2027-01-02");
});

test("addMinutesToTime suma minutos y envuelve al pasar de medianoche", () => {
  assert.equal(addMinutesToTime("09:00", 30), "09:30");
  assert.equal(addMinutesToTime("09:45", 60), "10:45");
  assert.equal(addMinutesToTime("23:15", 120), "01:15");
});

test("buildAgendaWeekDays y buildAgendaMonthCells alinean semanas completas desde lunes", () => {
  const semana = buildAgendaWeekDays("2026-11-04");
  assert.equal(semana.length, 7);
  assert.equal(semana[0], "2026-11-02");
  assert.equal(semana[6], "2026-11-08");

  const celdas = buildAgendaMonthCells("2026-11");
  assert.equal(celdas.length % 7, 0);
  assert.equal(celdas[0], "2026-10-26");
  assert.equal(celdas[celdas.length - 1], "2026-12-06");
});

test("shiftAgendaAnchor y formatAgendaPeriodLabel avanzan por mes o por semana según el modo", () => {
  assert.equal(shiftAgendaAnchor("2026-11-04", "lista", 1), "2026-12-01");
  assert.equal(shiftAgendaAnchor("2026-11-04", "mes", -1), "2026-10-01");
  assert.equal(shiftAgendaAnchor("2026-11-04", "marca", 1), "2026-11-11");

  const semana = buildAgendaWeekDays("2026-11-04");
  assert.equal(formatAgendaPeriodLabel("2026-11-04", semana, "lista"), "Noviembre 2026");
  assert.match(formatAgendaPeriodLabel("2026-11-04", semana, "marca"), /^2 nov – 8 nov 2026$/i);
});

test("buildCalendarEntries combina posts, tareas pendientes y actividades, filtra y ordena por fecha y hora", () => {
  const posts = [
    post({
      id: "p-1",
      brandId: "brand-a",
      title: "Reel de café",
      scheduledDate: "2026-11-04",
      scheduledTime: "11:00",
      networks: ["Instagram"],
      format: "Reel / Video",
    }),
    post({
      id: "p-2",
      brandId: "brand-b",
      title: "Carrusel clínica",
      scheduledDate: "2026-11-04",
      scheduledTime: "08:00",
      networks: ["LinkedIn"],
      format: "Carrusel",
    }),
  ];
  const tasks = [
    { id: "t-1", brandId: "brand-a", title: "Entregar guion", dueDate: "2026-11-04", completed: false },
    { id: "t-done", brandId: "brand-a", title: "Hecha", dueDate: "2026-11-04", completed: true },
  ];
  const activities: CalendarActivity[] = [
    {
      id: "a-1",
      brandId: "brand-a",
      isoDate: "2026-11-04",
      title: "Grabación",
      category: "Grabación",
      time: "09:30",
      repeat: "none",
    },
  ];

  const todas = buildCalendarEntries(posts, tasks, activities, {
    showPosts: true,
    showActivities: true,
    brandFilter: [],
    networkFilter: [],
    formatFilter: [],
  });
  assert.deepEqual(
    todas.map((e) => e.id),
    ["task-t-1", "post-p-2", "a-1-0", "post-p-1"]
  );

  const porDia = groupEntriesByDay(todas);
  assert.equal(porDia.get("2026-11-04")?.length, 4);

  const soloMarcaARed = buildCalendarEntries(posts, tasks, activities, {
    showPosts: true,
    showActivities: true,
    brandFilter: ["brand-a"],
    networkFilter: ["Instagram"],
    formatFilter: [],
  });
  assert.deepEqual(
    soloMarcaARed.map((e) => e.id),
    ["post-p-1"]
  );

  assert.equal(
    countActiveCalendarFilters({
      showPosts: false,
      showActivities: true,
      brandFilter: ["brand-a"],
      networkFilter: ["Instagram"],
      formatFilter: ["Carrusel"],
    }),
    4
  );
});
