"use client";

import { useState } from "react";
import { useHublyStore } from "@/lib/store";
import { EmptyState } from "@/components/app/ui/EmptyState";
import { AGENDA_WEEKDAYS, type CalendarEntry } from "@/lib/domain/posts";
import { renderCalendarEntryChip } from "./CalendarioMes";

interface CalendarioMarcasProps {
  weekDays: readonly string[];
  todayIso: string;
  entries: readonly CalendarEntry[];
  entriesByDay: ReadonlyMap<string, CalendarEntry[]>;
  onOpenEntry: (entry: CalendarEntry) => void;
  onNewActivity: (isoDate: string) => void;
}

export function CalendarioMarcas({
  weekDays,
  todayIso,
  entries,
  entriesByDay,
  onOpenEntry,
  onNewActivity,
}: CalendarioMarcasProps) {
  const brands = useHublyStore((s) => s.brands);
  const [showEmptyBrands, setShowEmptyBrands] = useState(false);

  const brandsWithContent = brands.filter((brand) =>
    entries.some((e) => e.brandId === brand.id && weekDays.includes(e.isoDate))
  );
  const emptyBrandsCount = brands.length - brandsWithContent.length;
  const visibleBrands = showEmptyBrands ? brands : brandsWithContent;

  return (
    <div className="hubly-cal-month hubly-cal-brands">
      <div className="hubly-cal-brand-grid hubly-cal-brand-head">
        <div>Marca</div>
        {weekDays.map((iso, i) => (
          <div key={iso} className={iso === todayIso ? "is-today" : ""}>
            {AGENDA_WEEKDAYS[i]} {Number(iso.slice(8))}
          </div>
        ))}
      </div>
      {visibleBrands.map((brand) => (
        <div key={brand.id} className="hubly-cal-brand-grid hubly-cal-brand-row">
          <div className="hubly-cal-brand-name">
            <span
              className="hubly-cal-brand-dot"
              style={{ background: brand.color || "var(--hb-accent)" }}
            >
              {brand.name.charAt(0)}
            </span>
            <span>{brand.name}</span>
          </div>
          {weekDays.map((iso) => (
            <div key={iso} className="hubly-cal-brand-cell" onClick={() => onNewActivity(iso)}>
              {(entriesByDay.get(iso) || [])
                .filter((e) => e.brandId === brand.id)
                .map((entry) => renderCalendarEntryChip(entry, onOpenEntry))}
            </div>
          ))}
        </div>
      ))}
      {visibleBrands.length === 0 && <EmptyState title="Sin contenido esta semana" />}
      {emptyBrandsCount > 0 && (
        <button
          type="button"
          className="hubly-cal-more-brands"
          onClick={() => setShowEmptyBrands((v) => !v)}
        >
          {showEmptyBrands
            ? "Ocultar marcas sin contenido"
            : `Mostrar ${emptyBrandsCount} ${emptyBrandsCount === 1 ? "marca" : "marcas"} sin contenido esta semana`}
        </button>
      )}
    </div>
  );
}
