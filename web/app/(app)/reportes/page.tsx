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
  HublyHomeIcon as Home,
  HublyLinkIcon as Link2,
  HublyPlusIcon as Plus,
  HublyPresentationIcon,
  HublyPresentationIcon as Presentation,
  HublyPrinterIcon as Printer,
  HublyPulseIcon as TrendingUp,
  HublyRowsIcon as List,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

export default function ReportesPage() {
  if (backendEnabled) return <LiveReportes />;
  return <DemoReportesPage />;
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

  const [execSummary, setExecSummary] = useState(
    "Durante el periodo del 23 al 30 de octubre consolidamos el posicionamiento mayorista de Min (Mineralia USA) en Instagram y Meta Ads, logrando 268 visitas calificadas al perfil con un CTR promedio de 5.40% y un costo por visita de $8.33 USD."
  );
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
      {/* Top Hubi Sub-Navigation Bar (10b-social-media-reportes-1440.png) */}
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
          style={{
            display: "inline-flex",
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

          <button
            disabled
            data-planned
            title="Función prevista"
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              background: "var(--ui-surface)",
              color: "var(--hb-accent-text)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Presentation size={14} style={{ color: "var(--hb-accent-text)" }} />
            <span>Reportes</span>
          </button>

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

      {/* Secondary Toolbar matching 10b-social-media-reportes-1440.png */}
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
        <button
          disabled
          data-planned
          title="Función prevista"
          type="button"
          style={{
            width: 38,
            height: 32,
            borderRadius: 10,
            border: "none",
            background: "var(--ui-accent-soft)",
            color: "var(--hb-accent-text)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <Home size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            disabled
            data-planned
            title="Función prevista"
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: "var(--ui-text-2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <MessageCircle size={15} />
            <span>Comentarios</span>
          </button>

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
            onClick={() => setShowPrintableSheet(true)}
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

      {/* Hubi Empty-State Card (10b-social-media-reportes-1440.png) */}
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
            background: "#DBEAFE",
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
          onClick={() => setShowPrintableSheet(true)}
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
          {/* Report Header Banner */}
          <div
            style={{
              padding: "24px 28px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)",
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
                Reporte Ejecutivo en 1 Clic · 23 oct - 30 oct
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
                {brandName} · Informe Mensual de Resultados
              </h1>
              <div style={{ fontSize: 13, color: "#DCEFF9" }}>
                {activeBrand?.industry || "minerales y cristales decorativos al mayoreo"} · Redes
                conectadas: Instagram, Facebook, TikTok, LinkedIn
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
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
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
                <div style={{ fontSize: 12, color: "var(--ui-text-4)", fontWeight: 600, marginBottom: 6 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ui-text)", marginBottom: 4 }}>
                  {kpi.value}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#059669",
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
