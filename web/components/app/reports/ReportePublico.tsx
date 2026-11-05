"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MonthlyReportBody } from "./MonthlyReport";
import { localIsoDate } from "@/lib/date";
import { resolveReportMonth } from "@/lib/domain/reports";
import { buildMonthlyReport } from "@/lib/reporting";
import { useHublyStore } from "@/lib/store";
import "./reporte.css";

export function ReportePublico() {
  const brandId = useParams<{ brandId: string }>()?.brandId;
  const requested = useSearchParams().get("mes") || "";
  const month = resolveReportMonth(requested, localIsoDate());

  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const brand = useHublyStore((s) => s.brands.find((b) => b.id === brandId));
  const posts = useHublyStore((s) => s.posts);
  const agency = useHublyStore((s) => s.agency?.name || s.agencyName);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void syncFromServer().finally(() => setReady(true));
  }, [syncFromServer]);

  if (!ready) {
    return <main className="hubly-reporte hubly-reporte--center">Cargando…</main>;
  }

  if (!brand) {
    return <main className="hubly-reporte hubly-reporte--center">No encontramos esta marca.</main>;
  }

  const report = buildMonthlyReport(
    posts.filter((p) => p.brandId === brand.id),
    month,
  );
  const label = new Date(`${month}-15T12:00:00`).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="hubly-reporte">
      <div className="hubly-reporte-toolbar no-print">
        <button type="button" onClick={() => window.print()} className="hubly-reporte-print">
          Imprimir o guardar PDF
        </button>
      </div>
      <header className="hubly-reporte-header">
        <div className="hubly-reporte-agency">{agency}</div>
        <h1 className="hubly-reporte-title">Reporte de {brand.name}</h1>
        <div className="hubly-reporte-month">{label}</div>
      </header>
      <MonthlyReportBody brand={brand} report={report} />
    </main>
  );
}
