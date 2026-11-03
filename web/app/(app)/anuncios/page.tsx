"use client";

import { LiveUnavailable } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyBentoIcon as LayoutGrid,
  HublyBoltIcon as Bolt,
  HublyClockIcon as Clock,
  HublyCloseIcon as X,
  HublyInfoIcon as Info,
  HublyMegaphoneIcon as Megaphone,
  HublyPresentationIcon as Presentation,
  HublyPulseIcon as Gauge,
  HublySearchIcon as Search,
  HublySparkIcon as Sparkles,
  HublyTableIcon as Table2,
  HublyTimelineIcon as GitBranch,
  type DuotoneIconProps,
} from "@/components/app/icons/DuotoneIcons";

interface SampleAdCard {
  id: string;
  title: string;
  titleIcon?: React.ComponentType<DuotoneIconProps>;
  artworkKind: "thehive" | "taxco-quartz" | "veracruz-amethyst" | "mineralia-live" | "bee-here";
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
    artworkKind: "thehive",
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
    artworkKind: "taxco-quartz",
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
    artworkKind: "thehive",
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
    title: "Instagram post: VERACRUZ AMETHYST | TATATILA,...",
    titleIcon: Sparkles,
    artworkKind: "veracruz-amethyst",
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
    title: "Instagram post: MineraliA LIVE SALE — Rare Specimens...",
    titleIcon: Bolt,
    artworkKind: "mineralia-live",
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
    artworkKind: "mineralia-live",
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
    artworkKind: "thehive",
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
    title: "Publicación de Instagram: LAST DAYS — BEE HERE BEFORE IT ENDS...",
    titleIcon: Clock,
    artworkKind: "bee-here",
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

function AdPosterArtwork({ kind }: { kind: SampleAdCard["artworkKind"] }) {
  if (kind === "thehive") {
    return (
      <svg
        viewBox="0 0 280 340"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        {/* Foliage & Sky Top */}
        <rect width="280" height="340" fill="var(--hb-accent-hover)" />
        <path d="M0 0 L280 0 L280 140 L0 140 Z" fill="var(--hb-accent)" />
        {/* Tree canopy texture */}
        <circle cx="40" cy="30" r="55" fill="var(--hb-accent-hover)" opacity="0.8" />
        <circle cx="120" cy="20" r="65" fill="var(--hb-accent)" opacity="0.7" />
        <circle cx="230" cy="35" r="60" fill="var(--hb-accent-hover)" opacity="0.85" />
        {/* Sunlight glow behind tent */}
        <rect x="0" y="95" width="280" height="80" fill="var(--ui-sky)" opacity="0.22" />

        {/* Blue-roof Barn / Pavilion in Round Top */}
        <polygon points="15,175 105,125 195,175" fill="var(--hb-accent)" />
        <polygon points="165,175 230,132 280,175" fill="var(--hb-accent-hover)" />
        <rect x="25" y="175" width="160" height="45" fill="var(--hb-accent-hover)" />
        {/* Warm interior lights */}
        <rect x="50" y="185" width="25" height="22" fill="var(--ui-sky)" opacity="0.25" />
        <rect x="95" y="185" width="30" height="22" fill="var(--ui-sky-border)" opacity="0.25" />
        <rect x="140" y="185" width="25" height="22" fill="var(--ui-sky)" opacity="0.25" />

        {/* Lawn & gravel path */}
        <rect x="0" y="218" width="280" height="122" fill="var(--hb-accent)" />
        <polygon points="0,245 280,225 280,275 0,295" fill="var(--ui-border-strong)" opacity="0.35" />

        {/* Honeycomb Hexagon Icon top-right */}
        <g transform="translate(178, 12)" stroke="var(--on-accent)" strokeWidth="1.8" fill="none">
          <polygon points="12,0 22,6 22,18 12,24 2,18 2,6" />
          <polygon points="24,8 34,14 34,26 24,32 14,26 14,14" />
          <polygon points="12,22 22,28 22,40 12,46 2,40 2,28" />
        </g>

        {/* THE HIVE Typography */}
        <text
          x="130"
          y="42"
          textAnchor="middle"
          fill="var(--on-accent)"
          fontSize="24"
          letterSpacing="2"
        >
          THE
        </text>
        <text
          x="140"
          y="82"
          textAnchor="middle"
          fill="var(--on-accent)"
          fontSize="44"
          letterSpacing="3"
        >
          HIVE
        </text>

        <text
          x="140"
          y="128"
          textAnchor="middle"
          fill="var(--ui-sky-border)"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2.5"
        >
          THE FALL SHOW
        </text>
        <text
          x="140"
          y="168"
          textAnchor="middle"
          fill="var(--on-accent)"
          fontSize="20"
          fontWeight="600"
        >
          Through October 31
        </text>
        <text
          x="140"
          y="190"
          textAnchor="middle"
          fill="var(--on-accent)"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="1.2"
        >
          OPEN DAILY · 9 AM–6 PM
        </text>
        <text
          x="140"
          y="206"
          textAnchor="middle"
          fill="var(--ui-sky-border)"
          fontSize="8.5"
        >
          Hwy 237 &amp; W Fuchs Rd · Carmine, Texas
        </text>

        {/* Social Handle & URL */}
        <circle cx="90" cy="246" r="7" stroke="var(--on-accent)" strokeWidth="1.5" fill="none" />
        <circle cx="108" cy="246" r="7" fill="var(--on-accent)" />
        <text x="164" y="250" textAnchor="middle" fill="var(--on-accent)" fontSize="10" fontWeight="600">
          @thehiveroundtop
        </text>
        <text x="140" y="268" textAnchor="middle" fill="var(--on-accent)" fontSize="11" fontWeight="600">
          thehiveroundtop.com
        </text>
      </svg>
    );
  }

  if (kind === "taxco-quartz") {
    return (
      <svg
        viewBox="0 0 280 340"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        {/* Display box & dark velvet lining */}
        <rect width="280" height="340" fill="var(--ui-border-strong)" />
        <polygon points="35,20 275,35 260,295 20,275" fill="var(--ui-surface-2)" stroke="var(--ui-text-5)" strokeWidth="2" />
        <polygon points="50,35 255,48 242,275 38,255" fill="var(--hb-accent-hover)" />

        {/* Hand holding the crystal specimen */}
        <path
          d="M0 70 C55 45 105 70 115 135 C120 190 95 265 40 320 L0 320 Z"
          fill="var(--ui-sky-border)"
        />

        {/* Sparkling Silver/White Taxco Quartz Cluster */}
        <g transform="translate(22, 32)">
          <polygon points="85,15 135,5 165,45 120,75 65,55" fill="var(--ui-text-5)" />
          <polygon points="45,50 115,35 155,95 95,135 25,105" fill="var(--ui-border-strong)" />
          <polygon points="95,45 185,30 220,95 165,155 85,125" fill="var(--ui-text-4)" />
          <polygon points="35,95 110,75 145,145 85,195 15,155" fill="var(--ui-text-5)" />
          <polygon points="85,110 175,85 215,155 155,220 75,185" fill="var(--ui-border)" />
          <polygon points="25,145 95,125 135,195 75,245 10,205" fill="var(--ui-text-4)" />
          {/* White druzy quartz crystal points */}
          <polygon points="75,55 95,38 112,62 90,78" fill="var(--ui-surface-2)" />
          <polygon points="125,75 152,58 168,85 140,102" fill="var(--on-accent)" />
          <polygon points="55,110 82,92 98,118 72,135" fill="var(--ui-muted)" />
          <polygon points="105,135 138,112 158,145 122,168" fill="var(--on-accent)" />
          <polygon points="145,150 175,132 192,162 162,182" fill="var(--ui-surface-2)" />
          <polygon points="68,168 98,148 115,178 85,198" fill="var(--ui-border)" />
          <circle cx="95" cy="65" r="3" fill="var(--on-accent)" />
          <circle cx="145" cy="95" r="3.5" fill="var(--on-accent)" />
          <circle cx="128" cy="142" r="4" fill="var(--on-accent)" />
          <circle cx="82" cy="122" r="3" fill="var(--on-accent)" />
          <circle cx="165" cy="158" r="3" fill="var(--on-accent)" />
        </g>
      </svg>
    );
  }

  if (kind === "veracruz-amethyst") {
    return (
      <svg
        viewBox="0 0 280 340"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        {/* Studio background */}
        <rect width="280" height="340" fill="var(--ui-muted)" />
        {/* Fingers holding the amethyst specimen */}
        <ellipse cx="45" cy="65" rx="65" ry="42" fill="var(--ui-border)" />
        <ellipse cx="40" cy="155" rx="58" ry="44" fill="var(--ui-border-strong)" />
        <ellipse cx="45" cy="245" rx="62" ry="45" fill="var(--ui-border)" />
        <ellipse cx="235" cy="165" rx="60" ry="95" fill="var(--ui-border-strong)" />

        {/* Translucent Crystal Points */}
        <g transform="translate(38, 18)">
          <polygon points="75,10 105,45 92,115 58,95" fill="var(--hb-accent)" opacity="0.85" />
          <polygon points="110,5 148,50 132,125 95,105" fill="var(--hb-accent-hover)" opacity="0.9" />
          <polygon points="45,55 88,85 75,165 32,135" fill="var(--ui-sky)" opacity="0.85" />
          <polygon points="85,65 135,95 118,185 68,155" fill="var(--hb-accent)" opacity="0.92" />
          <polygon points="128,60 185,95 165,180 115,150" fill="var(--hb-accent)" opacity="0.85" />
          <polygon points="55,135 112,165 95,245 38,215" fill="var(--hb-accent-hover)" opacity="0.9" />
          <polygon points="105,130 165,165 145,255 88,225" fill="var(--hb-accent-hover)" opacity="0.92" />
          {/* Crystalline highlights */}
          <polygon points="82,25 98,52 88,95 72,75" fill="var(--ui-sky-soft)" opacity="0.65" />
          <polygon points="118,22 138,55 125,105 108,82" fill="var(--ui-surface)" opacity="0.55" />
          <polygon points="95,85 122,108 110,162 82,138" fill="var(--ui-sky-border)" opacity="0.6" />
          <polygon points="65,150 95,172 82,225 55,198" fill="var(--ui-sky-soft)" opacity="0.55" />
          <circle cx="95" cy="55" r="3.5" fill="var(--on-accent)" />
          <circle cx="125" cy="95" r="4" fill="var(--on-accent)" />
          <circle cx="85" cy="145" r="3.5" fill="var(--on-accent)" />
          <circle cx="135" cy="175" r="3" fill="var(--on-accent)" />
        </g>
      </svg>
    );
  }

  if (kind === "mineralia-live") {
    return (
      <svg
        viewBox="0 0 280 340"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        <rect width="280" height="340" fill="var(--hb-accent-hover)" />
        <circle cx="220" cy="60" r="70" fill="var(--hb-accent)" opacity="0.55" />
        <circle cx="60" cy="180" r="85" fill="var(--hb-accent)" opacity="0.5" />
        <text x="95" y="28" fill="var(--on-accent)" fontSize="13" fontWeight="700">
          MineraliA
        </text>
        <text x="175" y="27" fill="var(--ui-sky-border)" fontSize="9.5" fontWeight="600">
          @amethysts.us
        </text>
        <text
          x="140"
          y="78"
          textAnchor="middle"
          fill="var(--ui-sky)"
          fontSize="34"
          fontWeight="900"
          letterSpacing="1.5"
        >
          LIVE SALE
        </text>
        {/* Crystal cluster silhouette */}
        <polygon points="90,220 115,125 140,220" fill="var(--hb-accent)" />
        <polygon points="120,220 148,110 176,220" fill="var(--ui-sky)" />
        <polygon points="155,220 178,135 202,220" fill="var(--ui-sky-border)" />
        <polygon points="70,220 92,150 112,220" fill="var(--hb-accent)" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 280 340"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <rect width="280" height="340" fill="var(--hb-accent-hover)" />
      <text
        x="140"
        y="28"
        textAnchor="middle"
        fill="var(--ui-sky)"
        fontSize="9.5"
        fontWeight="800"
        letterSpacing="2.5"
      >
        LAST DAYS
      </text>
      <text
        x="140"
        y="56"
        textAnchor="middle"
        fill="var(--ui-sky-border)"
        fontSize="24"
        fontWeight="900"
        letterSpacing="1"
      >
        BEE HERE
      </text>
      <text
        x="140"
        y="80"
        textAnchor="middle"
        fill="var(--on-accent)"
        fontSize="20"
        fontWeight="800"
        letterSpacing="0.5"
      >
        BEFORE IT ENDS
      </text>
      <polygon points="30,220 140,145 250,220" fill="var(--hb-accent)" />
      <rect x="45" y="220" width="190" height="65" fill="var(--hb-accent-hover)" />
    </svg>
  );
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
  const lastSelectedAd = useRef<SampleAdCard | null>(null);
  if (selectedAd) lastSelectedAd.current = selectedAd;
  const activeAd = selectedAd ?? lastSelectedAd.current;
  const modalPresence = useModalPresence(selectedAd !== null);
  useLayer(selectedAd !== null, () => setSelectedAd(null));

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
      {/* Top Sub-Navigation Bar matching 11-analytics-ads-1440.png */}
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
              boxShadow: "0 1px 2px rgb(var(--hb-accent-rgb) / 0.08)",
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

        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--ui-text)", margin: 0, letterSpacing: "-0.02em" }}>Anuncios</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} />
      </div>

      <div
        role="note"
        aria-label="Aviso de datos de ejemplo"
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

      {/* 4 KPI Cards Row (1:1 with 11-analytics-ads-1440.png) */}
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
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ui-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                fontVariantNumeric: "tabular-nums",
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
            aria-label="Buscar anuncios"
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
                background: "var(--ui-surface)",
                color: "var(--ui-text)",
                fontSize: 13,
                outline: "none",
              }}
            />
          )}
        </div>

        {/* Right: View Switcher (Cards | Tabla | Funnels) */}
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
                color: viewMode === "cards" ? "var(--hb-accent-text)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "cards" ? "0 1px 2px rgb(var(--hb-accent-rgb) / 0.08)" : "none",
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
                color: viewMode === "table" ? "var(--hb-accent-text)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 1px 2px rgb(var(--hb-accent-rgb) / 0.08)" : "none",
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
                color: viewMode === "funnels" ? "var(--hb-accent-text)" : "var(--ui-text-4)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: viewMode === "funnels" ? "0 1px 2px rgb(var(--hb-accent-rgb) / 0.08)" : "none",
              }}
            >
              <GitBranch size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 4-COLUMN AD CREATIVES GRID (1:1 with 11-analytics-ads-1440.png) */}
      {viewMode === "cards" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {visibleAds.map((ad) => {
            const TitleIcon = ad.titleIcon;
            return (
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
                  <AdPosterArtwork kind={ad.artworkKind} />

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
                      border: "1px solid var(--ui-border)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17.5 6.5C15.8 6.5 14.3 7.6 12.8 9.8C11.7 8.1 10.3 6.5 8.1 6.5C5.2 6.5 3 9 3 12.3C3 15.5 5.1 17.5 7.4 17.5C9.3 17.5 10.9 16.2 12.5 13.7C13.6 15.6 15 17.5 17.2 17.5C19.9 17.5 22 15 22 11.8C22 8.7 20 6.5 17.5 6.5ZM7.5 15.3C6.1 15.3 5.1 14.1 5.1 12.2C5.1 10.1 6.3 8.7 8 8.7C9.4 8.7 10.4 9.8 11.4 11.5C10.1 13.8 8.9 15.3 7.5 15.3ZM17.1 15.3C15.8 15.3 14.7 13.9 13.7 12.1C14.8 10.1 16 8.7 17.4 8.7C18.9 8.7 19.9 10 19.9 11.9C19.9 13.9 18.7 15.3 17.1 15.3Z"
                        fill="#0081FB" // ui-ok: color de marca de Meta
                      />
                    </svg>
                  </div>

                  {/* Bottom Surface Bar + Ad Title */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: "10px 14px",
                      background: "var(--ui-surface-2)",
                      borderTop: "1px solid var(--ui-border)",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--ui-text)",
                        fontSize: 12.5,
                        fontWeight: 700,
                        lineHeight: 1.35,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {TitleIcon ? <TitleIcon size={15} /> : null}
                      <span>{ad.title}</span>
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
                          background: "var(--ui-positive-soft)",
                          color: "var(--ui-positive-text)",
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
                          background: "var(--hb-accent)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>
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
                            ad.resultadosBadgeColor === "green"
                              ? "rgb(var(--hb-accent-rgb) / 0.14)"
                              : "var(--ui-muted)",
                          color:
                            ad.resultadosBadgeColor === "green"
                              ? "var(--hb-accent-text)"
                              : "var(--ui-text-2)",
                          fontWeight: 700,
                          fontSize: 12,
                          padding: "1px 7px",
                          borderRadius: 6,
                          fontVariantNumeric: "tabular-nums",
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
                      <span style={{ fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>{ad.gasto}</span>
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
                      <span style={{ fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>
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
                      <span style={{ fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>{ad.clicks}</span>
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
                      <span style={{ fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>
                        {ad.pctCampana}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: FULL NUMERICAL COMPARISON TABLE */}
      {(viewMode === "table" || viewMode === "funnels") && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            overflowX: "auto",
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
              {visibleAds.map((ad) => {
                const TitleIcon = ad.titleIcon;
                return (
                  <tr key={ad.id} style={{ borderBottom: "1px solid var(--ui-muted)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ui-text)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {TitleIcon ? <TitleIcon size={15} /> : null}
                        <span>{ad.title}</span>
                        <ExampleTag />
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          background: "var(--ui-positive-soft)",
                          color: "var(--ui-positive-text)",
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
                        color: "var(--ui-text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {ad.clickScore}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {ad.resultados}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {ad.gasto}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {ad.costoResultado}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {ad.clicks}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {ad.pctCampana}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Analizar Creativo con Hubi */}
      {modalPresence.mounted && activeAd && (
        <div
          className="hubly-overlay hubly-cal-overlay"
          data-state={modalPresence.state}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedAd(null);
          }}
          style={{ zIndex: "var(--layer-modal)" }}
        >
          <div
            className="hubly-sheet hubly-cal-modal"
            data-state={modalPresence.state}
            role="dialog"
            aria-modal="true"
            aria-label="Ejemplo de diagnóstico"
          >
            <div className="hubly-cal-modal-head">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgb(var(--hb-accent-rgb) / 0.08)",
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
                className="hubly-cal-modal-close"
                aria-label="Cerrar"
                title="Cerrar"
                onClick={() => setSelectedAd(null)}
              >
                <X size={14} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: "0 0 10px" }}>
              Hubi todavía no analiza anuncios.
            </p>

            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: "0 0 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {activeAd.titleIcon ? <activeAd.titleIcon size={16} /> : null}
              <span>{activeAd.title}</span>
            </h3>

            <p style={{ fontSize: 13.5, color: "var(--ui-text-2)", lineHeight: 1.55, marginBottom: 16 }}>
              {activeAd.aiInsight}
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
                <div style={{ fontWeight: 700, color: "var(--ui-text)", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                  {activeAd.clickScore}/100
                </div>
              </div>
              <div>
                <div style={{ color: "var(--ui-text-4)" }}>Resultados</div>
                <div style={{ fontWeight: 700, color: "var(--ui-text)", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                  {activeAd.resultados}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--ui-text-4)" }}>Costo/Res.</div>
                <div style={{ fontWeight: 700, color: "var(--ui-text)", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                  {activeAd.costoResultado}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
