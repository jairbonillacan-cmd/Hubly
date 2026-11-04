"use client";

import Link from "next/link";
import { HublyClipboardIcon, } from "@/components/app/icons/HublyIcons";
import {
  HublyCheckCircleIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { InicioViewModel } from "./useInicioView";

export function WidgetProyectosCriticos({ view }: { view: InicioViewModel }) {
  const { brands, criticalProjects } = view;
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
        <div className="hb-widget-body" style={{ padding: "12px 14px" }}>
          {criticalProjects.map((project) => (
            <Link key={project.id} href="/proyectos" className="hubly-task-row" style={{ textDecoration: "none" }}>
              <span style={{ minWidth: 0 }}>
                <span className="hubly-task-title" style={{ display: "block", fontWeight: 600 }}>
                  {project.title}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>
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
