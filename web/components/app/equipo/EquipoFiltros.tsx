"use client";

import { useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublySlidersIcon as SlidersHorizontal } from "@/components/app/icons/DuotoneIcons";

interface EquipoFiltrosProps {
  showAllTeamScope: boolean;
  teamCount: number;
  brandFilterId: string;
  onSelectMyScope: () => void;
  onSelectAllTeamScope: () => void;
  onBrandFilterChange: (brandId: string) => void;
  onQuickAction: (action: "complete_task" | "record_activity") => void;
}

export function EquipoFiltros({
  showAllTeamScope,
  teamCount,
  brandFilterId,
  onSelectMyScope,
  onSelectAllTeamScope,
  onBrandFilterChange,
  onQuickAction,
}: EquipoFiltrosProps) {
  const brands = useHublyStore((s) => s.brands);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPresence = useModalPresence(filtersOpen, 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setFiltersOpen((prev) => !prev)}
        className="hbtn-outline hubly-equipo-filter-btn"
        aria-expanded={filtersOpen}
      >
        <SlidersHorizontal size={13} />
        <span>Filtros</span>
      </button>

      {filtersPresence.mounted && (
        <div
          className="hubly-dropdown hubly-equipo-filter-popover"
          data-state={filtersPresence.state}
        >
          <div className="hubly-equipo-filter-heading">Alcance del equipo</div>
          <div className="hubly-equipo-filter-scope-row">
            <button
              type="button"
              aria-pressed={!showAllTeamScope}
              onClick={onSelectMyScope}
              className="hubly-equipo-filter-scope-btn"
            >
              Mi vista (1)
            </button>
            <button
              type="button"
              aria-pressed={showAllTeamScope}
              onClick={onSelectAllTeamScope}
              className="hubly-equipo-filter-scope-btn"
            >
              Todo el equipo ({teamCount})
            </button>
          </div>

          <div className="hubly-equipo-filter-heading hubly-equipo-filter-heading-brands">
            Filtrar por marca
          </div>
          <div className="hubly-equipo-filter-brands-row">
            <button
              type="button"
              aria-pressed={brandFilterId === "all"}
              onClick={() => onBrandFilterChange("all")}
              className="hubly-equipo-filter-brand-btn"
            >
              Todas
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={brandFilterId === b.id}
                onClick={() => onBrandFilterChange(b.id)}
                className="hubly-equipo-filter-brand-btn"
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="hubly-equipo-filter-actions">
            <button
              type="button"
              onClick={() => {
                onQuickAction("complete_task");
                setFiltersOpen(false);
              }}
              className="hubly-equipo-filter-action-btn"
            >
              <span>Completar tarea en curso</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickAction("record_activity");
                setFiltersOpen(false);
              }}
              className="hubly-equipo-filter-action-btn"
            >
              <span>Registrar entrega activa</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
