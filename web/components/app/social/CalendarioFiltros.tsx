"use client";

import { useEffect, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  AGENDA_FORMATS,
  AGENDA_NETWORKS,
  countActiveCalendarFilters,
} from "@/lib/domain/posts";
import {
  HublyCheckIcon as Check,
  HublyFilterIcon as Filter,
} from "@/components/app/icons/DuotoneIcons";
import type { CalendarFilterGroup } from "./useCalendarioView";

interface CalendarioFiltrosProps {
  brandFilter: readonly string[];
  networkFilter: readonly string[];
  formatFilter: readonly string[];
  showPosts: boolean;
  showActivities: boolean;
  onToggleFilter: (group: CalendarFilterGroup, value?: string) => void;
}

export function CalendarioFiltros({
  brandFilter,
  networkFilter,
  formatFilter,
  showPosts,
  showActivities,
  onToggleFilter,
}: CalendarioFiltrosProps) {
  const brands = useHublyStore((s) => s.brands);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const filtersPresence = useModalPresence(filtersOpen, 100);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (e: MouseEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filtersOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filterCount = countActiveCalendarFilters({
    showPosts,
    showActivities,
    brandFilter,
    networkFilter,
    formatFilter,
  });

  return (
    <div ref={filtersRef} className="hubly-social-cal-filters-wrap">
      <button
        type="button"
        className="hubly-cal-icon"
        aria-label="Filtros"
        title="Filtros"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <Filter size={15} />
        {filterCount > 0 && <span className="hubly-cal-filter-dot" />}
      </button>
      {filtersPresence.mounted && (
        <div className="hubly-dropdown hubly-cal-filters" data-state={filtersPresence.state}>
          <h3>Filtros</h3>
          <section>
            <div className="hubly-cal-filter-label">Marcas</div>
            <input
              className="hubly-cal-input"
              placeholder="Buscar marca…"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
            {brands
              .filter((b) => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase()))
              .map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  className="hubly-cal-brand-option"
                  aria-pressed={brandFilter.includes(brand.id)}
                  onClick={() => onToggleFilter("brand", brand.id)}
                >
                  <span className="hubly-cal-checkbox">
                    {brandFilter.includes(brand.id) && <Check size={11} />}
                  </span>
                  <span
                    className="hubly-cal-brand-dot"
                    style={{ background: brand.color || "var(--hb-accent)" }}
                  >
                    {brand.name.charAt(0)}
                  </span>
                  <span>{brand.name}</span>
                </button>
              ))}
          </section>
          <section>
            <div className="hubly-cal-filter-label">Red social</div>
            <div className="hubly-cal-pills">
              {AGENDA_NETWORKS.map((network) => (
                <button
                  key={network}
                  type="button"
                  className="hubly-cal-pill"
                  aria-pressed={networkFilter.includes(network)}
                  onClick={() => onToggleFilter("network", network)}
                >
                  {network}
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="hubly-cal-filter-label">Tipo de contenido</div>
            <div className="hubly-cal-pills">
              {AGENDA_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  className="hubly-cal-pill"
                  aria-pressed={formatFilter.includes(format)}
                  onClick={() => onToggleFilter("format", format)}
                >
                  {format}
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="hubly-cal-filter-label">Mostrar</div>
            <div className="hubly-cal-pills">
              <button
                type="button"
                className="hubly-cal-pill"
                aria-pressed={showPosts}
                onClick={() => onToggleFilter("posts")}
              >
                Posts
              </button>
              <button
                type="button"
                className="hubly-cal-pill"
                aria-pressed={showActivities}
                onClick={() => onToggleFilter("activities")}
              >
                Actividades
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
