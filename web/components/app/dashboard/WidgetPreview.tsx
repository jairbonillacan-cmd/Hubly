"use client";

import React, { useMemo } from "react";
import { useHublyStore } from "@/lib/store";
import { selectTasksBreakdown, selectTodayPostsAndApprovals } from "@/lib/domain-selectors";
import { KraftNotebookCard } from "@/components/app/KraftNotebookCard";
import {
  HublyBellIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyCheckCircleIcon,
  HublyClipboardIcon,
  HublyLayersIcon,
  HublyMegaphoneIcon,
  HublyNotebookIcon,
} from "@/components/app/icons/DuotoneIcons";
import {
  ExtraWidget,
  WidgetFila,
  WidgetShell,
  WidgetVacio,
  fechaCorta,
  selectCriticalProjects,
} from "@/components/app/dashboard/ExtraWidgets";
import type { DashboardWidgetId } from "@/lib/types";

const useReloj = () => ({
  fixedIsoNow: useHublyStore((s) => s.testClock?.fixedIsoNow),
  timezone: useHublyStore((s) => s.profile?.timezone),
});

function TareasPreview() {
  const tasks = useHublyStore((s) => s.tasks);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const { fixedIsoNow, timezone } = useReloj();
  const groups = useMemo(
    () =>
      selectTasksBreakdown(tasks, activeBrandId, true, fixedIsoNow, timezone).groups.filter(
        (g) => g.tasks.length > 0
      ),
    [activeBrandId, fixedIsoNow, tasks, timezone]
  );

  return (
    <WidgetShell icon={<HublyClipboardIcon size={18} />} title="Tareas">
      {groups.length === 0 ? (
        <WidgetVacio icon={<HublyCheckCircleIcon size={26} />} title="Todo al día" text="No tienes tareas pendientes." />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {groups.map((group) => (
            <div key={group.bucket}>
              <div className="hubly-wgal-rotulo">{group.label}</div>
              {group.tasks.map((task) => (
                <div key={task.id} className="hubly-task-row">
                  <span className="hubly-check" data-done={false} />
                  <span className="hubly-task-title">{task.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function LibretasPreview() {
  const notebooks = useHublyStore((s) => s.notebooks);
  return (
    <WidgetShell icon={<HublyNotebookIcon size={18} />} title="Libretas">
      <div className="hb-widget-body hubly-wfilas">
        <div className="hubly-shelf">
          {notebooks.slice(0, 6).map((nb) => (
            <KraftNotebookCard
              key={nb.id}
              title={nb.title}
              stamp={nb.stamp || ""}
              variant={nb.variant}
              subtitle={nb.subtitle}
              category={nb.category}
              isPinned={nb.isPinned}
              accentColor={nb.accentColor}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

function NotificacionesPreview() {
  const notifications = useHublyStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read);
  return (
    <WidgetShell icon={<HublyBellIcon size={18} />} title="Notificaciones">
      {unread.length === 0 ? (
        <WidgetVacio
          icon={<HublyBellIcon size={26} />}
          title="Sin notificaciones nuevas"
          text="Lo que necesite tu atención aparece aquí."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {unread.slice(0, 5).map((n) => (
            <WidgetFila key={n.id} title={n.title} meta={n.body} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function ProyectosPreview() {
  const projects = useHublyStore((s) => s.projects);
  const brands = useHublyStore((s) => s.brands);
  const criticos = useMemo(() => selectCriticalProjects(projects), [projects]);
  return (
    <WidgetShell icon={<HublyLayersIcon size={18} />} title="Proyectos críticos">
      {criticos.length === 0 ? (
        <WidgetVacio
          icon={<HublyCheckCircleIcon size={26} />}
          title="Sin proyectos en riesgo"
          text="Todos tus proyectos abiertos van en orden."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {criticos.map((project) => (
            <WidgetFila
              key={project.id}
              title={project.title}
              meta={`${brands.find((b) => b.id === project.brandId)?.name || "Marca"} · ${project.status}`}
              side={<span className="hubly-wfila-lado">{project.progress}%</span>}
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function HoyPreview() {
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const { fixedIsoNow, timezone } = useReloj();
  const { todayPosts } = useMemo(
    () => selectTodayPostsAndApprovals(posts, activeBrandId, fixedIsoNow, true, timezone),
    [activeBrandId, fixedIsoNow, posts, timezone]
  );
  return (
    <WidgetShell icon={<HublyCalendarIcon size={18} />} title="Hoy">
      {todayPosts.length === 0 ? (
        <WidgetVacio
          icon={<HublyCalendarIcon size={26} />}
          title="Sin eventos para hoy"
          text="Hoy no sale nada programado."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {todayPosts.slice(0, 5).map((post) => (
            <WidgetFila key={post.id} title={post.title} meta={`${post.scheduledTime} · ${post.networks.join(", ")}`} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function AprobacionesPreview() {
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const brands = useHublyStore((s) => s.brands);
  const { fixedIsoNow, timezone } = useReloj();
  const { approvalPosts } = useMemo(
    () => selectTodayPostsAndApprovals(posts, activeBrandId, fixedIsoNow, true, timezone),
    [activeBrandId, fixedIsoNow, posts, timezone]
  );
  return (
    <WidgetShell icon={<HublyCheckCircleIcon size={18} />} title="Aprobaciones">
      {approvalPosts.length === 0 ? (
        <WidgetVacio
          icon={<HublyCheckCircleIcon size={26} />}
          title="Sin aprobaciones pendientes"
          text="Aquí verás lo que espera a tu cliente."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {approvalPosts.slice(0, 5).map((post) => (
            <WidgetFila
              key={post.id}
              title={post.title}
              meta={`${brands.find((b) => b.id === post.brandId)?.name || "Marca"} · ${fechaCorta(post.scheduledDate)}`}
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function GraficaAdsPreview() {
  const ads = useHublyStore((s) => s.ads);
  const gasto = ads.reduce((acc, a) => acc + (a.spend || 0), 0);
  const ctr = ads.length > 0 ? (ads.reduce((acc, a) => acc + a.ctr, 0) / ads.length).toFixed(2) : "0.00";
  return (
    <WidgetShell icon={<HublyChartIcon size={18} />} title="Gráfica de Ads">
      <div className="hb-widget-body hubly-wmetrica">
        <div className="hubly-wnumero">{gasto.toLocaleString("es-MX")} MXN</div>
        <div className="hubly-wnumero-rotulo">Inversión acumulada · CTR {ctr}%</div>
      </div>
    </WidgetShell>
  );
}

function AdsActivosPreview() {
  const ads = useHublyStore((s) => s.ads);
  const activos = ads.filter((a) => a.status === "Activo");
  return (
    <WidgetShell icon={<HublyMegaphoneIcon size={18} />} title="Ads activos">
      {activos.length === 0 ? (
        <WidgetVacio
          icon={<HublyMegaphoneIcon size={26} />}
          title="Sin ads activos"
          text="Aquí verás las campañas en circulación."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {activos.slice(0, 5).map((ad) => (
            <WidgetFila key={ad.id} title={ad.name} meta={`${ad.platform} · ${ad.results} ${ad.resultLabel}`} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

export function WidgetPreview({ id }: { id: DashboardWidgetId }) {
  switch (id) {
    case "tareas":
      return <TareasPreview />;
    case "libretas":
      return <LibretasPreview />;
    case "notificaciones":
      return <NotificacionesPreview />;
    case "proyectos_criticos":
      return <ProyectosPreview />;
    case "hoy":
      return <HoyPreview />;
    case "aprobaciones":
      return <AprobacionesPreview />;
    case "grafica_ads":
      return <GraficaAdsPreview />;
    case "ads_activos":
      return <AdsActivosPreview />;
    default:
      return <ExtraWidget id={id} />;
  }
}
