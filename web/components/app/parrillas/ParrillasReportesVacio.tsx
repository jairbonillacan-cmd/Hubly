"use client";

import Link from "next/link";
import { HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";

export function ParrillasReportesVacio() {
  return (
    <div>
      <div className="hubly-parrillas-reports-toolbar">
        <div className="hubly-parrillas-reports-actions">
          <div className="hubly-parrillas-reports-pill" />

          <Link href="/reportes" className="hubly-parrillas-reports-new-sm">
            <Plus size={15} />
            <span>Nuevo</span>
          </Link>
        </div>
      </div>

      <div className="hubly-parrillas-reports-empty">
        <div className="hubly-parrillas-reports-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--hb-accent)" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="17" x2="8" y2="13" />
            <line x1="12" y1="17" x2="12" y2="11" />
            <line x1="16" y1="17" x2="16" y2="15" />
          </svg>
        </div>

        <h2 className="hubly-parrillas-reports-title">No hay reportes aún</h2>
        <p className="hubly-parrillas-reports-desc">Crea tu primer reporte para empezar</p>

        <Link href="/reportes" className="hubly-parrillas-reports-new-lg">
          <Plus size={15} />
          <span>Nuevo reporte</span>
        </Link>
      </div>
    </div>
  );
}
