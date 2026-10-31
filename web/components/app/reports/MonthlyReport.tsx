"use client";

import { useState } from "react";
import { buildMonthlyReport, type MonthlyReportData } from "@/lib/reporting";
import { localIsoDate } from "@/lib/date";
import type { BrandWorkspace, SocialPost } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("es-MX");
const monthLabel = (m: string) =>
  new Date(`${m}-15T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(" de ", " ");

export function MonthlyReportBody({ brand, report }: { brand?: BrandWorkspace; report: MonthlyReportData }) {
  const target = brand?.monthlyPostTarget || 0;
  const maxReach = report.byNetwork[0]?.reach || 1;
  const tiles = [
    { label: "Publicados", value: target ? `${report.published} de ${target}` : fmt(report.published) },
    { label: "Alcance", value: fmt(report.reach) },
    { label: "Interacciones", value: fmt(report.interactions) },
    { label: "Interacción sobre alcance", value: report.engagementRate === null ? "—" : `${report.engagementRate.toFixed(1)}%` },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{t.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>{t.value}</div>
          </div>
        ))}
      </div>
      {report.published > report.measured && (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ui-text-3)" }}>
          {report.published - report.measured} publicaciones aún no tienen resultados capturados y no suman a estas cifras.
        </p>
      )}
      {report.byNetwork.length > 0 && (
        <section style={card}>
          <h3 style={h3}>Alcance por red</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {report.byNetwork.map((row) => (
              <div key={row.network} title={`${row.network}: ${fmt(row.reach)} de alcance en ${row.posts} posts`} style={{ display: "grid", gridTemplateColumns: "84px minmax(0, 1fr) 64px", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ui-text-2)" }}>
                <span>{row.network}</span>
                <span style={{ height: 10, display: "block", background: "var(--ui-muted)", borderRadius: 4 }}>
                  <span style={{ display: "block", height: "100%", width: `${(row.reach / maxReach) * 100}%`, background: "#6C77C1", borderRadius: "0 4px 4px 0" }} />
                </span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.reach)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section style={{ ...card, overflowX: "auto" }}>
        <h3 style={h3}>Mejores publicaciones</h3>
        {report.top.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-4)" }}>
            Aún no hay resultados este mes. Se capturan en la pestaña Resultados de cada post publicado.
          </p>
        ) : (
          <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ui-text-4)", fontSize: 12 }}>
                <th style={cell}>Post</th>
                <th style={{ ...cell, textAlign: "right" }}>Alcance</th>
                <th style={{ ...cell, textAlign: "right" }}>Me gusta</th>
                <th style={{ ...cell, textAlign: "right" }}>Guardados</th>
              </tr>
            </thead>
            <tbody>
              {report.top.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--ui-muted)" }}>
                  <td style={{ ...cell, fontWeight: 600 }}>{p.title}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.reach)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.likes)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.saves)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function MonthlyReport({ brand, posts }: { brand?: BrandWorkspace; posts: SocialPost[] }) {
  const [month, setMonth] = useState(() => localIsoDate().slice(0, 7));
  const report = buildMonthlyReport(posts, month);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ui-text)", margin: 0, textTransform: "capitalize" }}>
          {brand?.name} · {monthLabel(month)}
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Mes del reporte" style={{ border: "1px solid var(--ui-border-strong)", borderRadius: 8, padding: "5px 8px", fontSize: 13, background: "var(--ui-surface)" }} />
          {brand && (
            <a href={`/reporte/${encodeURIComponent(brand.id)}?mes=${month}`} target="_blank" rel="noopener noreferrer" style={{ background: "#6C77C1", color: "#FFFFFF", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
              Exportar PDF
            </a>
          )}
        </div>
      </div>
      <MonthlyReportBody brand={brand} report={report} />
    </div>
  );
}

const card = { background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: 16 } as const;
const h3 = { fontSize: 14, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 12px" } as const;
const cell = { padding: "8px 6px" } as const;
