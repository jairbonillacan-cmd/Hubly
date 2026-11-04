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
import { SAMPLE_ADS_KPIS, type AnunciosViewMode } from "@/lib/domain/ads";

interface AnunciosCabeceraProps {
  viewMode: AnunciosViewMode;
  onViewModeChange: (mode: AnunciosViewMode) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function AnunciosCabecera({
  viewMode,
  onViewModeChange,
  searchOpen,
  onToggleSearch,
  searchQuery,
  onSearchQueryChange,
}: AnunciosCabeceraProps) {
  return (
    <>
      <div className="hubly-anuncios-subnav">
        <div className="hubly-pill-scroll hubly-anuncios-subnav-track">
          <Link href="/parrillas?tab=tableros" className="hubly-anuncios-subnav-link">
            <Gauge size={14} />
            <span>Tableros</span>
          </Link>

          <span aria-current="page" className="hubly-anuncios-subnav-link is-active">
            <Megaphone size={14} className="hubly-anuncios-subnav-icon" />
            <span>Anuncios</span>
          </span>

          <Link href="/parrillas?tab=ideas" className="hubly-anuncios-subnav-link">
            <Sparkles size={14} />
            <span>Ideas</span>
          </Link>

          <Link href="/reportes" className="hubly-anuncios-subnav-link">
            <Presentation size={14} />
            <span>Reportes</span>
          </Link>
        </div>

        <div className="hubly-anuncios-subnav-actions" />
      </div>

      <div className="hubly-cal-title-row hubly-anuncios-title-row">
        <div className="hubly-anuncios-title-col">
          <h1 className="hubly-cal-title">Anuncios</h1>
          <p className="hubly-cal-subtitle">Campañas y piezas promocionadas de tu marca.</p>
        </div>
      </div>

      <div role="note" className="hubly-anuncios-note">
        <Info size={16} className="hubly-anuncios-note-icon" />
        <span>Datos de ejemplo. Aún no hay una cuenta publicitaria conectada: estas cifras y anuncios no son de tu marca.</span>
      </div>

      <div className="hubly-anuncios-kpi-grid">
        {SAMPLE_ADS_KPIS.map((kpi) => (
          <div key={kpi.label} className="hubly-anuncios-kpi-card">
            <div className="hubly-anuncios-kpi-head">
              <span className="hubly-anuncios-kpi-label">{kpi.label}</span>
              <span className="hubly-anuncios-example-tag">Ejemplo</span>
            </div>
            <div className="hubly-anuncios-kpi-value" style={{ fontSize: 26 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="hubly-anuncios-toolbar">
        <div className="hubly-anuncios-search-row">
          <button
            type="button"
            title="Buscar anuncios"
            onClick={onToggleSearch}
            className="hubly-anuncios-search-btn"
          >
            <Search size={15} />
          </button>

          {searchOpen && (
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Buscar anuncio..."
              autoFocus
              className="hubly-anuncios-search-input"
            />
          )}
        </div>

        <div className="hubly-anuncios-toolbar-right">
          <div className="hubly-anuncios-view-track">
            <button
              type="button"
              aria-label="Cards"
              aria-pressed={viewMode === "cards"}
              title="Vista visual con creatividades"
              onClick={() => onViewModeChange("cards")}
              className="hubly-anuncios-view-btn"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              aria-label="Tabla"
              aria-pressed={viewMode === "table"}
              title="Comparación numérica completa"
              onClick={() => onViewModeChange("table")}
              className="hubly-anuncios-view-btn"
            >
              <Table2 size={14} />
            </button>
            <button
              type="button"
              aria-label="Funnels"
              aria-pressed={viewMode === "funnels"}
              title="Funnel: dónde caen las conversiones"
              onClick={() => onViewModeChange("funnels")}
              className="hubly-anuncios-view-btn"
            >
              <GitBranch size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
