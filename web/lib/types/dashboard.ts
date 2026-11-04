export type DashboardWidgetId =
  | "tareas"
  | "libretas"
  | "hoy"
  | "notificaciones"
  | "aprobaciones"
  | "grafica_ads"
  | "ads_activos"
  | "proyectos_criticos"
  | "metrica"
  | "posts"
  | "feed"
  | "semana"
  | "mensajes"
  | "actividad"
  | "equipo"
  | "reportes";

export type DashboardMetricId =
  | "publicados"
  | "programados"
  | "aprobaciones"
  | "gasto"
  | "resultados"
  | "ctr";

export type DashboardWidgetSpan = 1 | 2 | 3;

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  visible: boolean;
  enabled?: boolean;
  order: number;
  column: "left" | "right";
  span?: DashboardWidgetSpan;
  metric?: DashboardMetricId;
}

export interface OnboardingProgress {
  brandCreatedOrSelected: boolean;
  taskCreatedOrCompleted: boolean;
  postCreatedOrScheduled: boolean;
  teamCheckedOrInvited: boolean;
  dismissed: boolean;
  minimized: boolean;
  manualOverrides?: Record<string, boolean>;
}
