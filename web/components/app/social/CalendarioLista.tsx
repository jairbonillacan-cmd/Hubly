"use client";

import { useHublyStore } from "@/lib/store";
import { EmptyState } from "@/components/app/ui/EmptyState";
import {
  capitalizeText,
  formatAgendaDate,
  type CalendarEntry,
  type EntryKind,
} from "@/lib/domain/posts";
import {
  HublyCameraIcon as Camera,
  HublyClipboardIcon as ListChecks,
  HublyHashIcon as Hash,
} from "@/components/app/icons/DuotoneIcons";

const KIND_ICON: Record<EntryKind, typeof Hash> = {
  post: Hash,
  tarea: ListChecks,
  actividad: Camera,
};

interface CalendarioListaProps {
  listDays: readonly string[];
  entriesByDay: ReadonlyMap<string, CalendarEntry[]>;
  todayIso: string;
  activeEntryId: string | null;
  onOpenEntry: (entry: CalendarEntry) => void;
}

export function CalendarioLista({
  listDays,
  entriesByDay,
  todayIso,
  activeEntryId,
  onOpenEntry,
}: CalendarioListaProps) {
  const brands = useHublyStore((s) => s.brands);

  if (listDays.length === 0) {
    return (
      <EmptyState title="Nada programado este mes">
        Crea una actividad o agenda un post para verlo aquí.
      </EmptyState>
    );
  }

  return (
    <div className="hubly-cal-agenda">
      {listDays.map((iso) => {
        const dayEntries = entriesByDay.get(iso) || [];
        const isToday = iso === todayIso;
        return (
          <div key={iso} className="hubly-cal-day">
            <div className={`hubly-cal-date ${isToday ? "is-today" : ""}`}>
              <span>{formatAgendaDate(iso, { weekday: "short" }).replace(".", "")}</span>
              <strong>{Number(iso.slice(8))}</strong>
            </div>
            <div className="hubly-social-cal-flex-main">
              <div className="hubly-cal-day-head">
                <span className={isToday ? "is-today" : ""}>
                  {capitalizeText(
                    formatAgendaDate(iso, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).replace(",", "")
                  )}
                </span>
                {isToday && <em>Hoy</em>}
                <small>
                  {dayEntries.length} {dayEntries.length === 1 ? "actividad" : "actividades"}
                </small>
              </div>
              <div className="hubly-cal-rows">
                {dayEntries.map((entry) => {
                  const Icon = KIND_ICON[entry.kind];
                  return (
                    <div
                      key={entry.id}
                      className="hubly-cal-row"
                      title={`${entry.label} · ${entry.title}`}
                      role={entry.kind === "actividad" ? undefined : "button"}
                      aria-current={activeEntryId === entry.id ? "true" : undefined}
                      tabIndex={entry.kind === "actividad" ? undefined : 0}
                      onClick={() => onOpenEntry(entry)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onOpenEntry(entry);
                      }}
                    >
                      <span className="hubly-cal-row-icon" data-kind={entry.kind}>
                        <Icon size={17} />
                      </span>
                      <div className="hubly-social-cal-flex-main">
                        <div className="hubly-cal-row-title">{entry.title}</div>
                        <div className="hubly-cal-row-meta">
                          <span className="hubly-social-cal-kind-label" data-kind={entry.kind}>
                            {entry.label}
                          </span>
                          {brands.length > 1 && entry.brandId && (
                            <span>· {brands.find((b) => b.id === entry.brandId)?.name}</span>
                          )}
                        </div>
                      </div>
                      {entry.time && <span className="hubly-cal-row-time">{entry.time}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
