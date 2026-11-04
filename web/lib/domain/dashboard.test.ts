import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQuickTaskInput,
  notebookStamp,
  reorderWidgetDragIds,
  selectOrderedVisibleWidgets,
  serializeWidgetsLayout,
  sortDashboardWidgets,
  summarizeAdsMetrics,
} from "./dashboard";
import type { AdCreative, DashboardWidgetConfig } from "../types";

const widget = (overrides: Partial<DashboardWidgetConfig>): DashboardWidgetConfig => ({
  id: "tareas",
  title: "Tareas",
  description: "Pendientes",
  visible: true,
  order: 1,
  column: "left",
  ...overrides,
});

const ad = (overrides: Partial<AdCreative>): AdCreative => ({
  id: "ad-1",
  brandId: "brand-a",
  name: "Campaña",
  platform: "Meta",
  cover: "cup",
  status: "Activo",
  spend: 1000,
  results: 25,
  resultLabel: "leads",
  cpa: 40,
  ctr: 2.5,
  clickScore: 80,
  hookScore: 75,
  ...overrides,
});

test("notebookStamp formatea número y fecha o solo el número si la fecha es inválida", () => {
  assert.equal(notebookStamp(0, "2026-10-15T12:00:00Z"), "N° 01 · OCT 26");
  assert.equal(notebookStamp(11, "fecha-invalida"), "N° 12");
});

test("buildQuickTaskInput asigna etiqueta y fecha según el bucket y descarta títulos vacíos", () => {
  assert.equal(
    buildQuickTaskInput({
      title: "   ",
      dueBucket: "today",
      priority: "Media",
      brandId: "brand-min",
      assignee: "Ana",
      todayIso: "2026-10-30",
      tomorrowIso: "2026-10-31",
    }),
    null
  );

  const hoy = buildQuickTaskInput({
    title: "  Revisar pauta  ",
    dueBucket: "today",
    priority: "Alta",
    brandId: "brand-min",
    assignee: "Ana",
    todayIso: "2026-10-30",
    tomorrowIso: "2026-10-31",
  });
  assert.deepEqual(hoy, {
    brandId: "brand-min",
    title: "Revisar pauta",
    dueLabel: "Hoy",
    dueDate: "2026-10-30",
    dueBucket: "today",
    priority: "Alta",
    assignee: "Ana",
    listName: "General",
    status: "pendiente",
  });

  const manana = buildQuickTaskInput({
    title: "Enviar reporte",
    dueBucket: "tomorrow",
    priority: "Baja",
    brandId: null,
    assignee: "",
    todayIso: "2026-10-30",
    tomorrowIso: "2026-10-31",
  });
  assert.equal(manana?.dueLabel, "Mañana");
  assert.equal(manana?.dueDate, "2026-10-31");
  assert.equal(manana?.brandId, "");
  assert.equal(manana?.assignee, "Jair");

  const atrasada = buildQuickTaskInput({
    title: "Cerrar factura",
    dueBucket: "overdue",
    priority: "Media",
    todayIso: "2026-10-30",
    tomorrowIso: "2026-10-31",
  });
  assert.equal(atrasada?.dueLabel, "Atrasada");
  assert.equal(atrasada?.dueDate, "2026-10-30");
});

test("sortDashboardWidgets, selectOrderedVisibleWidgets y reorderWidgetDragIds ordenan y filtran widgets", () => {
  const items: DashboardWidgetConfig[] = [
    widget({ id: "hoy", order: 3, visible: true }),
    widget({ id: "tareas", order: 1, visible: true, span: 2 }),
    widget({ id: "libretas", order: 2, visible: false }),
    widget({ id: "aprobaciones", order: 4, visible: true }),
  ];

  assert.deepEqual(
    sortDashboardWidgets(items).map((w) => w.id),
    ["tareas", "libretas", "hoy", "aprobaciones"]
  );
  assert.deepEqual(
    selectOrderedVisibleWidgets(items, null).map((w) => w.id),
    ["tareas", "hoy", "aprobaciones"]
  );

  const reordenado = reorderWidgetDragIds(
    ["tareas", "libretas", "hoy", "aprobaciones"],
    "aprobaciones",
    "tareas"
  );
  assert.deepEqual(reordenado, ["aprobaciones", "tareas", "libretas", "hoy"]);
  assert.deepEqual(
    selectOrderedVisibleWidgets(items, reordenado).map((w) => w.id),
    ["aprobaciones", "tareas", "hoy"]
  );

  assert.deepEqual(serializeWidgetsLayout(items), [
    { id: "tareas", order: 1, span: 2, visible: true },
    { id: "libretas", order: 2, span: 1, visible: false },
    { id: "hoy", order: 3, span: 1, visible: true },
    { id: "aprobaciones", order: 4, span: 1, visible: true },
  ]);
});

test("summarizeAdsMetrics calcula gasto total, CTR promedio y filtra campañas activas", () => {
  assert.deepEqual(summarizeAdsMetrics([]), {
    totalSpend: 0,
    avgCtr: "0.00",
    activeCampaigns: [],
  });

  const ads = [
    ad({ id: "a1", status: "Activo", spend: 1200, ctr: 2.1 }),
    ad({ id: "a2", status: "Pausado", spend: 800, ctr: 1.5 }),
    ad({ id: "a3", status: "Activo", spend: 500, ctr: 3.0 }),
  ];
  const summary = summarizeAdsMetrics(ads);
  assert.equal(summary.totalSpend, 2500);
  assert.equal(summary.avgCtr, "2.20");
  assert.deepEqual(
    summary.activeCampaigns.map((a) => a.id),
    ["a1", "a3"]
  );
});
