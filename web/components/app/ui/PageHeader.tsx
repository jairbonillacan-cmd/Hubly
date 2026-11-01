import type { ReactNode } from "react";

/** Título de pantalla de la plantilla A de la guía. Va dentro de `.hubly-cal-header`. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="hubly-cal-title-row">
      <div className="hubly-page-head-text">
        <h1 className="hubly-cal-title">{title}</h1>
        {subtitle && <p className="hubly-cal-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="hubly-page-head-actions">{actions}</div>}
    </div>
  );
}
