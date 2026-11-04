"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { selectCriticalProjects } from "@/components/app/dashboard/ExtraWidgets";
import { HublyClipboardIcon } from "@/components/app/icons/HublyIcons";
import { HublyCheckCircleIcon } from "@/components/app/icons/DuotoneIcons";

export function WidgetProyectosCriticos() {
  const brands = useHublyStore((s) => s.brands);
  const projects = useHublyStore((s) => s.projects);
  const criticalProjects = useMemo(() => selectCriticalProjects(projects), [projects]);

  return (
    <section key="proyectos_criticos" data-widget-id="proyectos_criticos" className="hb-widget">
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyClipboardIcon size={18} />
          </span>
          <span>Proyectos críticos</span>
          {criticalProjects.length > 0 && (
            <span className="hb-widget-badge">{criticalProjects.length}</span>
          )}
        </div>
        <Link href="/proyectos" className="hb-widget-link">
          Ver proyectos →
        </Link>
      </div>
      {criticalProjects.length === 0 ? (
        <div className="hb-widget-body hb-widget-empty">
          <div className="hb-empty-illus">
            <HublyCheckCircleIcon size={26} />
          </div>
          <div className="hb-empty-title">Sin proyectos en riesgo</div>
          <p className="hb-empty-desc">Todos tus proyectos abiertos van en orden.</p>
        </div>
      ) : (
        <div className="hb-widget-body hubly-dashboard-body-projects">
          {criticalProjects.map((project) => (
            <Link
              key={project.id}
              href="/proyectos"
              className="hubly-task-row hubly-dashboard-project-link"
            >
              <span className="hubly-dashboard-item-main">
                <span className="hubly-task-title hubly-dashboard-project-title">
                  {project.title}
                </span>
                <span className="hubly-dashboard-project-meta">
                  {brands.find((b) => b.id === project.brandId)?.name || "Marca"} · {project.status}
                </span>
              </span>
              <span className="hb-widget-badge">{project.progress}%</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
