"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { buildMonthlyReport } from "@/lib/reporting";
import { MonthlyReportBody } from "@/components/app/reports/MonthlyReport";
import { localIsoDate } from "@/lib/date";
import "../../(app)/dashboard-polish.css";

function ReporteView() {
  const brandId = useParams<{ brandId: string }>()?.brandId;
  const requested = useSearchParams().get("mes") || "";
  const month = /^\d{4}-\d{2}$/.test(requested) ? requested : localIsoDate().slice(0, 7);
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const brand = useHublyStore((s) => s.brands.find((b) => b.id === brandId));
  const posts = useHublyStore((s) => s.posts);
  const agency = useHublyStore((s) => s.agency?.name || s.agencyName);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void syncFromServer().finally(() => setReady(true));
  }, [syncFromServer]);

  if (!ready) return <main style={page}>Cargando…</main>;
  if (!brand) return <main style={page}>No encontramos esta marca.</main>;

  const report = buildMonthlyReport(posts.filter((p) => p.brandId === brand.id), month);
  const label = new Date(`${month}-15T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return (
    <main style={page}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button type="button" onClick={() => window.print()} style={{ border: 0, borderRadius: 9, background: "#6C77C1", color: "#FFFFFF", padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Imprimir o guardar PDF
        </button>
      </div>
      <header style={{ borderBottom: "2px solid #0F172A", paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#475569" }}>{agency}</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>Reporte de {brand.name}</h1>
        <div style={{ fontSize: 14, color: "#475569" }}>{label}</div>
      </header>
      <MonthlyReportBody brand={brand} report={report} />
    </main>
  );
}

const page = { maxWidth: 800, margin: "0 auto", padding: "32px 20px", color: "#0F172A", background: "#FFFFFF", minHeight: "100vh" } as const;

export default function ReportePage() {
  return (
    <Suspense fallback={null}>
      <ReporteView />
    </Suspense>
  );
}
