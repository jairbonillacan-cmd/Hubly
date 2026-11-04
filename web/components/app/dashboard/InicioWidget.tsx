import { ExtraWidget } from "@/components/app/dashboard/ExtraWidgets";
import type { DashboardWidgetId } from "@/lib/types";
import type { InicioViewModel } from "./useInicioView";
import { WidgetTareas } from "./WidgetTareas";
import { WidgetLibretas } from "./WidgetLibretas";
import { WidgetHoy } from "./WidgetHoy";
import { WidgetNotificaciones } from "./WidgetNotificaciones";
import { WidgetAprobaciones } from "./WidgetAprobaciones";
import { WidgetGraficaAds } from "./WidgetGraficaAds";
import { WidgetAdsActivos } from "./WidgetAdsActivos";
import { WidgetProyectosCriticos } from "./WidgetProyectosCriticos";

/** Elige el widget del tablero. */
export function InicioWidget({ widgetId, view }: { widgetId: DashboardWidgetId; view: InicioViewModel }) {
  switch (widgetId) {
    case "tareas":
      return <WidgetTareas view={view} />;
    case "libretas":
      return <WidgetLibretas view={view} />;
    case "hoy":
      return <WidgetHoy view={view} />;
    case "notificaciones":
      return <WidgetNotificaciones view={view} />;
    case "aprobaciones":
      return <WidgetAprobaciones view={view} />;
    case "grafica_ads":
      return <WidgetGraficaAds view={view} />;
    case "ads_activos":
      return <WidgetAdsActivos view={view} />;
    case "proyectos_criticos":
      return <WidgetProyectosCriticos view={view} />;
    default:
      return <ExtraWidget id={widgetId} />;
  }
}
