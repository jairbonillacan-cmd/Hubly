"use client";

import { ExtraWidget } from "@/components/app/dashboard/ExtraWidgets";
import type { DashboardWidgetId } from "@/lib/types";
import { WidgetTareas } from "./WidgetTareas";
import { WidgetLibretas } from "./WidgetLibretas";
import { WidgetHoy } from "./WidgetHoy";
import { WidgetNotificaciones } from "./WidgetNotificaciones";
import { WidgetAprobaciones } from "./WidgetAprobaciones";
import { WidgetGraficaAds } from "./WidgetGraficaAds";
import { WidgetAdsActivos } from "./WidgetAdsActivos";
import { WidgetProyectosCriticos } from "./WidgetProyectosCriticos";

/** Elige el widget del tablero. */
export function InicioWidget({
  widgetId,
  filterByBrand,
  onToggleFilterByBrand,
}: {
  widgetId: DashboardWidgetId;
  filterByBrand: boolean;
  onToggleFilterByBrand: () => void;
}) {
  switch (widgetId) {
    case "tareas":
      return (
        <WidgetTareas
          filterByBrand={filterByBrand}
          onToggleFilterByBrand={onToggleFilterByBrand}
        />
      );
    case "libretas":
      return <WidgetLibretas />;
    case "hoy":
      return <WidgetHoy filterByBrand={filterByBrand} />;
    case "notificaciones":
      return <WidgetNotificaciones />;
    case "aprobaciones":
      return <WidgetAprobaciones filterByBrand={filterByBrand} />;
    case "grafica_ads":
      return <WidgetGraficaAds />;
    case "ads_activos":
      return <WidgetAdsActivos />;
    case "proyectos_criticos":
      return <WidgetProyectosCriticos />;
    default:
      return <ExtraWidget id={widgetId} />;
  }
}
