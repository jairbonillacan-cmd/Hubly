"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/ui/PageHeader";
import type { AgendaViewMode } from "@/lib/domain/posts";
import {
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon as CalendarPlus,
  HublyChevronLeftIcon as ChevronLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyPresentationIcon as Presentation,
  HublyRowsIcon as Rows3,
  HublyTagIcon as Tag,
} from "@/components/app/icons/DuotoneIcons";

const VIEW_TABS: readonly { id: AgendaViewMode; label: string; Icon: typeof Rows3 }[] = [
  { id: "lista", label: "Lista", Icon: Rows3 },
  { id: "mes", label: "Mes", Icon: LayoutGrid },
  { id: "marca", label: "Por marca", Icon: Tag },
];

interface CalendarioCabeceraProps {
  periodLabel: string;
  isTodayAnchor: boolean;
  activeMode: AgendaViewMode;
  onSelectMode: (mode: AgendaViewMode) => void;
  onNavigate: (action: "prev" | "next" | "today") => void;
  onNewActivity: () => void;
  children?: React.ReactNode;
}

export function CalendarioCabecera({
  periodLabel,
  isTodayAnchor,
  activeMode,
  onSelectMode,
  onNavigate,
  onNewActivity,
  children,
}: CalendarioCabeceraProps) {
  const router = useRouter();

  return (
    <header className="hubly-cal-header">
      <PageHeader
        title="Calendario"
        subtitle="Posts y actividades de todas tus marcas, en una sola agenda."
        actions={
          <>
            <button
              type="button"
              className="hubly-cal-reveal"
              title="Revisar la parrilla como presentación"
              onClick={() => router.push("/parrillas")}
            >
              <Presentation size={18} />
              <span>Revisar</span>
            </button>
            <button
              type="button"
              className="hubly-cal-reveal"
              title="Nueva actividad"
              onClick={onNewActivity}
            >
              <CalendarPlus size={18} />
              <span>Actividad</span>
            </button>
          </>
        }
      />

      <div className="hubly-cal-toolbar">
        <div className="hubly-social-cal-nav-group">
          <button
            type="button"
            className="hubly-cal-icon"
            aria-label="Anterior"
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="hubly-cal-icon"
            aria-label="Siguiente"
            onClick={() => onNavigate("next")}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            className="hubly-cal-today"
            aria-current={isTodayAnchor ? "date" : undefined}
            title="Volver al día de hoy"
            onClick={() => onNavigate("today")}
          >
            Ir a hoy
          </button>
        </div>
        <span className="hubly-cal-period">{periodLabel}</span>
        <div className="hubly-social-cal-spacer" />
        <div className="hubly-cal-tabs" role="tablist" aria-label="Vista">
          {VIEW_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeMode === id}
              aria-label={label}
              title={label}
              className="hubly-cal-tab"
              onClick={() => onSelectMode(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {children}
      </div>
    </header>
  );
}
