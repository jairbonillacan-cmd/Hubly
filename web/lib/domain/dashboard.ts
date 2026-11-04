import type {
  AdCreative,
  DashboardWidgetConfig,
  DashboardWidgetId,
  DashboardWidgetSpan,
  TaskDueBucket,
  TaskPriority,
} from "../types";
import type { AddTaskInput } from "./tasks";

const QUICK_TASK_DUE_LABEL: Record<TaskDueBucket, string> = {
  overdue: "Atrasada",
  today: "Hoy",
  tomorrow: "Mañana",
  upcoming: "Próximas",
};

interface QuickTaskDraft {
  title: string;
  dueBucket: TaskDueBucket;
  priority: TaskPriority;
  brandId?: string | null;
  assignee?: string | null;
  todayIso: string;
  tomorrowIso: string;
}

interface AdsMetricsSummary {
  totalSpend: number;
  avgCtr: string;
  activeCampaigns: AdCreative[];
}

/** Sello numérico y de mes/año para las libretas Kraft del tablero. */
export function notebookStamp(index: number, updatedAt: string): string {
  const date = new Date(updatedAt);
  const number = `N° ${String(index + 1).padStart(2, "0")}`;
  if (Number.isNaN(date.getTime())) return number;
  const month = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
  return `${number} · ${month} ${String(date.getFullYear()).slice(-2)}`;
}

/** Arma la tarea rápida desde el widget del tablero según el bucket de vencimiento. */
export function buildQuickTaskInput(draft: QuickTaskDraft): AddTaskInput | null {
  const clean = draft.title.trim();
  if (!clean) return null;
  const dueDate = draft.dueBucket === "tomorrow" ? draft.tomorrowIso : draft.todayIso;
  return {
    brandId: draft.brandId ?? "",
    title: clean,
    dueLabel: QUICK_TASK_DUE_LABEL[draft.dueBucket],
    dueDate,
    dueBucket: draft.dueBucket,
    priority: draft.priority,
    assignee: draft.assignee?.trim() || "Jair",
    listName: "General",
    status: "pendiente",
  };
}

/** Ordena los widgets por su posición guardada sin mutar el arreglo original. */
export function sortDashboardWidgets(widgets: DashboardWidgetConfig[]): DashboardWidgetConfig[] {
  return [...widgets].sort((a, b) => a.order - b.order);
}

/** Devuelve los widgets visibles respetando el orden temporal de arrastre si existe. */
export function selectOrderedVisibleWidgets(
  widgets: DashboardWidgetConfig[],
  dragOrder: DashboardWidgetId[] | null
): DashboardWidgetConfig[] {
  const sorted = sortDashboardWidgets(widgets);
  const ordered = dragOrder
    ? dragOrder.flatMap((id) => sorted.filter((w) => w.id === id))
    : sorted;
  return ordered.filter((w) => w.visible);
}

/** Reordena los identificadores durante el arrastre sobre otro widget. */
export function reorderWidgetDragIds(
  currentOrder: DashboardWidgetId[] | null,
  dragId: DashboardWidgetId | null,
  targetId: DashboardWidgetId
): DashboardWidgetId[] | null {
  if (!currentOrder || !dragId || dragId === targetId) return currentOrder;
  if (!currentOrder.includes(targetId) || !currentOrder.includes(dragId)) return currentOrder;
  const next = currentOrder.filter((id) => id !== dragId);
  next.splice(next.indexOf(targetId), 0, dragId);
  return next;
}

/** Serializa la disposición de widgets para copiarla al portapapeles. */
export function serializeWidgetsLayout(
  widgets: DashboardWidgetConfig[]
): Array<{ id: DashboardWidgetId; order: number; span: DashboardWidgetSpan; visible: boolean }> {
  return sortDashboardWidgets(widgets).map(({ id, order, span, visible }) => ({
    id,
    order,
    span: span ?? 1,
    visible,
  }));
}

/** Resume gasto acumulado, CTR promedio y campañas activas de los anuncios. */
export function summarizeAdsMetrics(ads: AdCreative[]): AdsMetricsSummary {
  const totalSpend = ads.reduce((acc, a) => acc + (a.spend || 0), 0);
  const avgCtr =
    ads.length > 0
      ? (ads.reduce((acc, a) => acc + a.ctr, 0) / ads.length).toFixed(2)
      : "0.00";
  const activeCampaigns = ads.filter((a) => a.status === "Activo");
  return { totalSpend, avgCtr, activeCampaigns };
}
