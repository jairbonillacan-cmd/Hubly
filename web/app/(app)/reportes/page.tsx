"use client";

import { MonthlyReport } from "@/components/app/reports/MonthlyReport";
import { backendEnabled } from "@/lib/supabase/config";

import React, { useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { Cover } from "@/components/Cover";
import {
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon,
  HublyChartIcon as BarChart2,
  HublyChatIcon as MessageCircle,
  HublyInfoIcon as Info,
  HublyLinkIcon as Link2,
  HublyPlusIcon as Plus,
  HublyPresentationIcon,
  HublyPrinterIcon as Printer,
  HublyPulseIcon as TrendingUp,
  HublyRowsIcon as List,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

export default function ReportesPage() {
  if (backendEnabled) return <LiveReportes />;
  return <DemoReportesPage />;
}

function ExampleTag() {
  return (
    <span
      style={{
        flexShrink: 0,
        background: "var(--ui-muted)",
        color: "var(--ui-text-3)",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      Ejemplo
    </span>
  );
}

function DemoReportesPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);

  const activeBrand =
    brands.find((b) => b.id === activeBrandId) ||
    brands.find((b) => b.id === "brand-min") ||
    brands[0];

  const brandName =
    activeBrand?.name || "";

  const [execSummary, setExecSummary] = useState("");
  const [showPrintableSheet, setShowPrintableSheet] = useState(true);

  const brandPosts = posts.filter((p) => p.brandId === activeBrand?.id);

  return (
    <div
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        paddingBottom: 60,
      }}
    >
      {/* Top Hubi Sub-Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          className="hubly-pill-scroll"
          style={{
            display: "inline-flex",
            maxWidth: "100%",
            alignItems: "center",
            gap: 2,
            background: "var(--ui-muted)",
            padding: 4,
            borderRadius: 999,
            overflowX: "auto",
          }}
        >
          <Link
            href="/parrillas?tab=calendario"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <HublyCalendarIcon size={18} />
            <span>Calendario</span>
          </Link>

          <Link
            href="/parrillas?tab=ideas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <Sparkles size={14} />
            <span>Ideas</span>
          </Link>

          <Link
            href="/parrillas?tab=mensajes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <MessageCircle size={14} />
            <span>Mensajes</span>
          </Link>

          <Link
            href="/anuncios"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <BarChart2 size={14} />
            <span>Analytics</span>
          </Link>

          <Link
            href="/parrillas?tab=tableros"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <LayoutGrid size={14} />
            <span>Tableros</span>
          </Link>

          

          <Link
            href="/parrillas?tab=liga"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              color: "var(--ui-text-3)",
              fontWeight: 500,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <Link2 size={14} />
            <span>Links</span>
          </Link>
        </div>

        <Link
          href="/parrillas"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            color: "var(--ui-text-2)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Link2 size={14} style={{ color: "var(--ui-text-4)" }} />
          <span>Cuentas</span>
        </Link>
      </div>

      {/* Secondary Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          

          <div
            style={{
              display: "inline-flex",
              background: "var(--ui-muted)",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setShowPrintableSheet(false)}
              title="Vista vacía Hubi"
              aria-label="Vista vacía Hubi"
              aria-pressed={!showPrintableSheet}
              style={{
                width: 28,
                height: 26,
                borderRadius: 7,
                border: "none",
                background: !showPrintableSheet ? "var(--ui-surface)" : "transparent",
                color: !showPrintableSheet ? "var(--ui-text)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: !showPrintableSheet ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setShowPrintableSheet(true)}
              title="Reporte Ejecutivo Imprimible"
              aria-label="Reporte Ejecutivo Imprimible"
              aria-pressed={showPrintableSheet}
              style={{
                width: 28,
                height: 26,
                borderRadius: 7,
                border: "none",
                background: showPrintableSheet ? "var(--ui-surface)" : "transparent",
                color: showPrintableSheet ? "var(--ui-text)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: showPrintableSheet ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <List size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--ui-surface)",
              color: "var(--ui-text)",
              border: "1px solid var(--ui-border-strong)",
              borderRadius: 10,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={14} />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExecSummary((prev) => (prev ? "" : "Resumen del periodo:"));
              setShowPrintableSheet(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--hb-accent)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={15} />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Hubi Empty-State Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "36px 20px",
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 18,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 999,
            background: "var(--ui-sky-soft)",
            color: "var(--hb-accent-text)",
            display: "grid",
            placeItems: "center",
            marginBottom: 16,
          }}
        >
          <HublyPresentationIcon size={28} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 6px" }}>
          No hay reportes aún
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ui-text-4)", margin: "0 0 18px" }}>
          Crea tu primer reporte para empezar
        </p>

        <button
          type="button"
          onClick={() => {
              setExecSummary((prev) => (prev ? "" : "Resumen del periodo:"));
              setShowPrintableSheet(true);
            }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--hb-accent)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          <span>Nuevo reporte</span>
        </button>
      </div>

      {/* Printable 1-Click Executive Report Sheet */}
      {showPrintableSheet && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 20,
            padding: "32px 36px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            role="note"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              padding: "10px 12px",
              border: "1px solid var(--ui-border)",
              borderRadius: 12,
              background: "var(--ui-surface-2)",
              color: "var(--ui-text-2)",
              fontSize: 12.5,
            }}
          >
            <Info size={16} style={{ flexShrink: 0, color: "var(--hb-accent-text)" }} />
            <span>
              Datos de ejemplo. Aún no hay redes conectadas para sincronizar métricas automáticamente: las cifras de este informe son demostrativas.
            </span>
          </div>

          {/* Report Header Banner */}
          <div
            style={{
              padding: "24px 28px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #0F2539 0%, #16324F 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#BFE2F4",
                  marginBottom: 6,
                }}
              >
                Reporte Ejecutivo · {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#FFFFFF" }}>
                {brandName} · Informe Mensual de Resultados
              </h1>
              <div style={{ fontSize: 13, color: "#DCEFF9" }}>
                {activeBrand?.industry || "Sin giro definido"} · {activeBrand?.connectedNetworks?.length
                  ? `Redes: ${activeBrand.connectedNetworks.join(", ")}`
                  : "Sin redes indicadas"}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "12px 18px",
                textAlign: "right",
              }}
            >
              <div style={{ fontSize: 11, color: "#DCEFF9" }}>Click Score Promedio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#6EE7B7" }}>100 / 100</div>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div
            className="hubly-reporte-cifras"
            style={{
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Gasto Total", value: "$2,231.21", delta: "Presupuesto optimizado" },
              { label: "Visitas al perfil", value: "268", delta: "+24.2% vs semana previa" },
              { label: "Costo por visita al perfil", value: "$8.33", delta: "Eficiencia alta" },
              { label: "CTR Promedio", value: "5.40%", delta: "Top 5% del sector" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: "var(--ui-surface-2)",
                  border: "1px solid var(--ui-border)",
                  borderRadius: 14,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--ui-text-4)", fontWeight: 600 }}>
                    {kpi.label}
                  </span>
                  <ExampleTag />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ui-text)", marginBottom: 4 }}>
                  {kpi.value}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--tinta-exito)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <TrendingUp size={12} />
                  <span>{kpi.delta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Editable Executive Summary */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ui-text)",
                marginBottom: 8,
              }}
            >
              Resumen Ejecutivo de la Agencia
            </label>
            <textarea
              value={execSummary}
              onChange={(e) => setExecSummary(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--ui-border-strong)",
                background: "var(--ui-surface-2)",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--ui-text-1)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Top Posts Grid */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 12px" }}>
              Publicaciones destacadas del mes
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {brandPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  style={{
                    borderRadius: 14,
                    border: "1px solid var(--ui-border)",
                    overflow: "hidden",
                    background: "var(--ui-surface-2)",
                  }}
                >
                  <div style={{ height: 140, position: "relative" }}>
                    <Cover kind={post.cover} />
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", marginBottom: 4 }}>
                      {post.networks.join(" · ")} · {post.format}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ui-text)", marginBottom: 8 }}>
                      {post.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--hb-accent-text)",
                      }}
                    >
                      <span>Alcance: {(post.metrics?.reach || 11400).toLocaleString()}</span>
                      <span>Guardados: {post.metrics?.saves || 245}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveReportes() {
  const brand = useHublyStore((s) => s.brands.find((b) => b.id === s.activeBrandId));
  const posts = useHublyStore((s) => s.posts);
  return <MonthlyReport brand={brand} posts={posts.filter((p) => p.brandId === brand?.id)} />;
}
