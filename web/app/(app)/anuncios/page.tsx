"use client";

import { Modal } from "@/components/app/ui/Modal";
import { LiveUnavailable } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";

import React, { useState } from "react";
import Link from "next/link";
import {
  HublyImageIcon,
  HublyBentoIcon as LayoutGrid,
  HublyCloseIcon as X,
  HublyInfoIcon as Info,
  HublyMegaphoneIcon as Megaphone,
  HublyPresentationIcon as Presentation,
  HublyPulseIcon as Gauge,
  HublySearchIcon as Search,
  HublySparkIcon as Sparkles,
  HublyTableIcon as Table2,
  HublyTimelineIcon as GitBranch,
} from "@/components/app/icons/DuotoneIcons";

interface SampleAdCard {
  id: string;
  title: string;
  status: "Activo";
  clickScore: number;
  resultados: number;
  resultadosBadgeColor: "yellow" | "green";
  gasto: string;
  costoResultado: string;
  clicks: number;
  pctCampana: string;
  aiInsight: string;
}

const SAMPLE_ADS: SampleAdCard[] = [
  {
    id: "hb-ad-1",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 45,
    resultadosBadgeColor: "yellow",
    gasto: "$425.50",
    costoResultado: "$9.46",
    clicks: 48,
    pctCampana: "19.00%",
    aiInsight:
      "El cartel de 'THE HIVE · Through October 31' genera alta intención presencial en compradores mayoristas de Round Top. Mantén presupuesto activo hasta el cierre del show.",
  },
  {
    id: "hb-ad-2",
    title: "Instagram post: TAXCO QUARTZ FROM GUERRERO,...",
    status: "Activo",
    clickScore: 100,
    resultados: 47,
    resultadosBadgeColor: "green",
    gasto: "$362.83",
    costoResultado: "$7.72",
    clicks: 54,
    pctCampana: "16.00%",
    aiInsight:
      "Mejor volumen de visitas al perfil (47) con excelente eficiencia ($7.72/visita). Mostrar la drusa de cuarzo de Taxco en mano da escala real inmediata.",
  },
  {
    id: "hb-ad-3",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 28,
    resultadosBadgeColor: "yellow",
    gasto: "$323.99",
    costoResultado: "$11.57",
    clicks: 46,
    pctCampana: "15.00%",
    aiInsight:
      "Variación de audiencia abierta para The Fall Show. Buen CTR inicial; considera rotar hacia el formato de video en mano para bajar el costo por resultado.",
  },
  {
    id: "hb-ad-4",
    title: "Instagram post: 💜VERACRUZ AMETHYST | TATATILA,...",
    status: "Activo",
    clickScore: 100,
    resultados: 39,
    resultadosBadgeColor: "yellow",
    gasto: "$298.40",
    costoResultado: "$7.65",
    clicks: 44,
    pctCampana: "13.37%",
    aiInsight:
      "El costo por visita más bajo del top 4 ($7.65). El contraste de la amatista de Tatatila, Veracruz en primer plano detiene el scroll en los primeros 1.5 segundos.",
  },
  {
    id: "hb-ad-5",
    title: "Instagram post: 🎃 MineraliA LIVE SALE — Rare Specimens...",
    status: "Activo",
    clickScore: 100,
    resultados: 34,
    resultadosBadgeColor: "green",
    gasto: "$248.10",
    costoResultado: "$7.30",
    clicks: 41,
    pctCampana: "11.12%",
    aiInsight:
      "Anuncio de urgencia para transmisión en vivo (@amethysts.us). Convierte muy bien en recordatorios y mensajes directos previos al Live.",
  },
  {
    id: "hb-ad-6",
    title: "Instagram post: MineraliA LIVE SALE — Wholesale Lot...",
    status: "Activo",
    clickScore: 100,
    resultados: 29,
    resultadosBadgeColor: "yellow",
    gasto: "$214.60",
    costoResultado: "$7.40",
    clicks: 36,
    pctCampana: "9.62%",
    aiInsight:
      "Segmentación de dueños de boutiques de decoración y wellness. Excelente retención visual por el titular amarillo de alto contraste.",
  },
  {
    id: "hb-ad-7",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 24,
    resultadosBadgeColor: "yellow",
    gasto: "$189.40",
    costoResultado: "$7.89",
    clicks: 31,
    pctCampana: "8.49%",
    aiInsight:
      "Retargeting de visitantes del perfil en Texas y compradores mayoristas recurrentes.",
  },
  {
    id: "hb-ad-8",
    title: "Publicación de Instagram: 🐝 LAST DAYS — BEE HERE BEFORE IT ENDS...",
    status: "Activo",
    clickScore: 100,
    resultados: 22,
    resultadosBadgeColor: "green",
    gasto: "$168.39",
    costoResultado: "$7.65",
    clicks: 29,
    pctCampana: "7.40%",
    aiInsight:
      "Creativo de cierre de temporada ('LAST DAYS · BEE HERE BEFORE IT ENDS'). Alta tasa de clics en ubicación y cómo llegar.",
  },
];

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

export default function AnunciosPage() {
  if (backendEnabled) return <LiveUnavailable title="Anuncios" text="Las métricas de anuncios aparecerán cuando conectes las cuentas publicitarias de esta marca." />;
  return <DemoAnunciosPage />;
}

const SUBNAV_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "6px 14px",
  borderRadius: 999,
  color: "var(--ui-text-3)",
  fontWeight: 500,
  fontSize: 13,
  textDecoration: "none",
};

function DemoAnunciosPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table" | "funnels">("cards");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAd, setSelectedAd] = useState<SampleAdCard | null>(null);

  const visibleAds = SAMPLE_ADS.filter((ad) =>
    searchQuery.trim()
      ? ad.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  return (
    <div
      className="hubly-touch"
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
        paddingBottom: 60,
      }}
    >
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
      {viewMode === "cards" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {visibleAds.map((ad) => (
            <div
              key={ad.id}
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Creative Poster Cover (330px height) */}
              <div style={{ position: "relative", height: 330, overflow: "hidden" }}>
                <div className="hubly-anuncio-portada" aria-hidden><HublyImageIcon size={28} /></div>

                {/* Top-Left Meta Infinity Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "var(--ui-surface)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.5 6.5C15.8 6.5 14.3 7.6 12.8 9.8C11.7 8.1 10.3 6.5 8.1 6.5C5.2 6.5 3 9 3 12.3C3 15.5 5.1 17.5 7.4 17.5C9.3 17.5 10.9 16.2 12.5 13.7C13.6 15.6 15 17.5 17.2 17.5C19.9 17.5 22 15 22 11.8C22 8.7 20 6.5 17.5 6.5ZM7.5 15.3C6.1 15.3 5.1 14.1 5.1 12.2C5.1 10.1 6.3 8.7 8 8.7C9.4 8.7 10.4 9.8 11.4 11.5C10.1 13.8 8.9 15.3 7.5 15.3ZM17.1 15.3C15.8 15.3 14.7 13.9 13.7 12.1C14.8 10.1 16 8.7 17.4 8.7C18.9 8.7 19.9 10 19.9 11.9C19.9 13.9 18.7 15.3 17.1 15.3Z"
                      fill="#0081FB"
                    />
                  </svg>
                </div>

                {/* Bottom Dark Gradient Overlay + Ad Title */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "32px 14px 12px",
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.84) 100%)",
                  }}
                >
                  <div
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12.5,
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}
                  >
                    {ad.title}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "12px 14px 16px" }}>
                {/* Activo pill + Analizar button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {ad.status}
                    </span>
                    <ExampleTag />
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedAd(ad)}
                    style={{
                      background: "var(--hb-accent)",
                      color: "var(--on-accent)",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Ver ejemplo</span>
                  </button>
                </div>

                {/* Click 100 Progress Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 12,
                    marginBottom: 10,
                    borderBottom: "1px solid var(--ui-muted)",
                  }}
                >
                  <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 500 }}>
                    Click
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: "var(--ui-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${ad.clickScore}%`,
                        height: "100%",
                        background: "#10B981",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tinta-exito)" }}>
                    {ad.clickScore}
                  </span>
                </div>

                {/* 5 Metrics Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5 }}>
                  {/* Row 1: Resultados */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Resultados
                    </span>
                    <span
                      style={{
                        background:
                          ad.resultadosBadgeColor === "green" ? "#DCFCE7" : "#E6F4FB",
                        color:
                          ad.resultadosBadgeColor === "green" ? "#15803D" : "var(--ui-accent-text)",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "1px 7px",
                        borderRadius: 6,
                      }}
                    >
                      {ad.resultados}
                    </span>
                  </div>

                  {/* Row 2: Gasto */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Gasto
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>{ad.gasto}</span>
                  </div>

                  {/* Row 3: Costo/Resultado */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Costo/Resultado
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>
                      {ad.costoResultado}
                    </span>
                  </div>

                  {/* Row 4: Clicks */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Clicks
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>{ad.clicks}</span>
                  </div>

                  {/* Row 5: % Campaña */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      % Campaña
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>
                      {ad.pctCampana}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: FULL NUMERICAL COMPARISON TABLE */}
      {(viewMode === "table" || viewMode === "funnels") && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ui-surface-2)", borderBottom: "1px solid var(--ui-border)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Anuncio
                </th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Estado
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Click Score
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Resultados
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Gasto
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Costo/Resultado
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Clicks
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  % Campaña
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleAds.map((ad) => (
                <tr key={ad.id} style={{ borderBottom: "1px solid var(--ui-muted)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ui-text)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {ad.title}
                      <ExampleTag />
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      {ad.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--tinta-exito)",
                    }}
                  >
                    {ad.clickScore}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.resultados}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.gasto}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.costoResultado}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.clicks}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.pctCampana}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Analizar Creativo con Hubi */}
      {selectedAd && (
        <Modal open onClose={() => setSelectedAd(null)} label="Ejemplo de diagnóstico">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              <Sparkles size={13} /> Ejemplo de diagnóstico
            </span>
            <button
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={() => setSelectedAd(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-4)" }}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: "0 0 10px" }}>
            Hubi todavía no analiza anuncios.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 10px" }}>
            {selectedAd.title}
          </h3>

          <p style={{ fontSize: 13.5, color: "var(--ui-text-2)", lineHeight: 1.55, marginBottom: 16 }}>
            {selectedAd.aiInsight}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              background: "var(--ui-surface-2)",
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Click Score</div>
              <div style={{ fontWeight: 800, color: "var(--tinta-exito)", fontSize: 15 }}>
                {selectedAd.clickScore}/100
              </div>
            </div>
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Resultados</div>
              <div style={{ fontWeight: 800, color: "var(--ui-text)", fontSize: 15 }}>
                {selectedAd.resultados}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--ui-text-4)" }}>Costo/Res.</div>
              <div style={{ fontWeight: 800, color: "var(--ui-text)", fontSize: 15 }}>
                {selectedAd.costoResultado}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
