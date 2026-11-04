"use client";

import Link from "next/link";
import {
  HublyBentoIcon as LayoutGrid,
  HublyInfoIcon as Info,
  HublyMegaphoneIcon as Megaphone,
  HublyPresentationIcon as Presentation,
  HublyPulseIcon as Gauge,
  HublySearchIcon as Search,
  HublySparkIcon as Sparkles,
  HublyTableIcon as Table2,
  HublyTimelineIcon as GitBranch,
} from "@/components/app/icons/DuotoneIcons";
import { ExampleTag, SUBNAV_LINK } from "./demoAnunciosPage-shared";
import type { DemoAnunciosPageModel } from "./useDemoAnunciosPage";

export function AnunciosCabecera({ view }: { view: DemoAnunciosPageModel }) {
  const { viewMode, setViewMode, searchOpen, setSearchOpen, searchQuery, setSearchQuery } = view;

  return (
    <>
      {/* Top Sub-Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left Pill Container */}
        <div
          className="hubly-pill-scroll"
          style={{
            display: "inline-flex",
            maxWidth: "100%",
            overflowX: "auto",
            alignItems: "center",
            gap: 2,
            background: "var(--ui-muted)",
            padding: 4,
            borderRadius: 999,
          }}
        >
          <Link href="/parrillas?tab=tableros" style={SUBNAV_LINK}>
            <Gauge size={14} />
            <span>Tableros</span>
          </Link>

          <span
            aria-current="page"
            style={{
              ...SUBNAV_LINK,
              background: "var(--ui-surface)",
              color: "var(--hb-accent-text)",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Megaphone size={14} style={{ color: "var(--hb-accent-text)" }} />
            <span>Anuncios</span>
          </span>

          <Link href="/parrillas?tab=ideas" style={SUBNAV_LINK}>
            <Sparkles size={14} />
            <span>Ideas</span>
          </Link>

          <Link
            href="/reportes"
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
            <Presentation size={14} />
            <span>Reportes</span>
          </Link>
        </div>

        {/* Right Date Picker Pill + Settings Icon with Red Notification Dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          

          
        </div>
      </div>

      <div className="hubly-cal-title-row" style={{ paddingTop: 0, paddingBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="hubly-cal-title">Anuncios</h1>
          <p className="hubly-cal-subtitle">Campañas y piezas promocionadas de tu marca.</p>
        </div>
      </div>

      <div
        role="note"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          padding: "10px 12px",
          border: "1px solid var(--ui-border)",
          borderRadius: 12,
          background: "var(--ui-surface-2)",
          color: "var(--ui-text-2)",
          fontSize: 12.5,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, color: "var(--hb-accent-text)" }} />
        <span>Datos de ejemplo. Aún no hay una cuenta publicitaria conectada: estas cifras y anuncios no son de tu marca.</span>
      </div>

      {/* 4 KPI Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Gasto Total", value: "$2,231.21" },
          { label: "Visitas al perfil", value: "268" },
          { label: "Costo por visita al perfil", value: "$8.33" },
          { label: "CTR Promedio", value: "5.40%" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--ui-surface)",
              border: "1px solid var(--ui-border)",
              borderRadius: 16,
              padding: "20px 22px",
            }}
          >
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ui-text-4)",
                  borderBottom: "1px dashed var(--ui-border-strong)",
                  paddingBottom: 1,
                }}
              >
                {kpi.label}
              </span>
              <ExampleTag />
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--ui-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter & View Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left: Search circle + Filtros pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            title="Buscar anuncios"
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface)",
              color: "var(--ui-text-3)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Search size={15} />
          </button>

          {searchOpen && (
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anuncio..."
              autoFocus
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid var(--ui-border-strong)",
                fontSize: 13,
                outline: "none",
              }}
            />
          )}

          
        </div>

        {/* Right: View Switcher (Cards | Tabla | Funnels) + Métricas 5 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--ui-muted)",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            <button
              type="button"
              aria-label="Cards"
              aria-pressed={viewMode === "cards"}
              title="Vista visual con creatividades"
              onClick={() => setViewMode("cards")}
              style={{
                width: 30,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: viewMode === "cards" ? "var(--ui-surface)" : "transparent",
                color: viewMode === "cards" ? "var(--hb-accent)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "cards" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              aria-label="Tabla"
              aria-pressed={viewMode === "table"}
              title="Comparación numérica completa"
              onClick={() => setViewMode("table")}
              style={{
                width: 30,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: viewMode === "table" ? "var(--ui-surface)" : "transparent",
                color: viewMode === "table" ? "var(--hb-accent)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <Table2 size={14} />
            </button>
            <button
              type="button"
              aria-label="Funnels"
              aria-pressed={viewMode === "funnels"}
              title="Funnel: dónde caen las conversiones"
              onClick={() => setViewMode("funnels")}
              style={{
                width: 30,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: viewMode === "funnels" ? "var(--ui-surface)" : "transparent",
                color: viewMode === "funnels" ? "var(--hb-accent)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "funnels" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <GitBranch size={14} />
            </button>
          </div>

          
        </div>
      </div>

      {/* VIEW 1: 4-COLUMN AD CREATIVES GRID */}
    </>
  );
}
