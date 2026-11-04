"use client";

import { AGENDA_WEEKDAYS, type CalendarEntry } from "@/lib/domain/posts";
import { HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";

export function renderCalendarEntryChip(
  entry: CalendarEntry,
  onOpenEntry: (entry: CalendarEntry) => void
) {
  return (
    <button
      key={entry.id}
      type="button"
      className="hubly-cal-chip"
      data-kind={entry.kind}
      title={`${entry.label} · ${entry.title}`}
      style={entry.color ? { background: `${entry.color}2A`, color: entry.color } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onOpenEntry(entry);
      }}
    >
      {entry.time && <span className="hubly-cal-chip-time">{entry.time}</span>}
      <span className="hubly-cal-chip-title">{entry.title}</span>
    </button>
  );
}

interface CalendarioMesProps {
  monthCells: readonly string[];
  monthKey: string;
  todayIso: string;
  entriesByDay: ReadonlyMap<string, CalendarEntry[]>;
  onOpenEntry: (entry: CalendarEntry) => void;
  onNewActivity: (isoDate: string) => void;
}

export function CalendarioMes({
  monthCells,
  monthKey,
  todayIso,
  entriesByDay,
  onOpenEntry,
  onNewActivity,
}: CalendarioMesProps) {
  return (
    <div className="hubly-cal-month">
      <div className="hubly-cal-weekdays">
        {AGENDA_WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="hubly-cal-grid">
        {monthCells.map((iso) => {
          const dayEntries = entriesByDay.get(iso) || [];
          const outside = !iso.startsWith(monthKey);
          return (
            <div
              key={iso}
              className={`hubly-cal-cell ${outside ? "is-outside" : ""}`}
              onClick={() => onNewActivity(iso)}
            >
              <div className="hubly-cal-cell-head">
                <span className={`hubly-cal-cell-num ${iso === todayIso ? "is-today" : ""}`}>
                  {Number(iso.slice(8))}
                </span>
                <button
                  type="button"
                  className="hubly-cal-cell-add"
                  aria-label="Nueva actividad este día"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewActivity(iso);
                  }}
                >
                  <Plus size={11} />
                </button>
              </div>
              <div className="hubly-cal-cell-items">
                {dayEntries.slice(0, 3).map((entry) => renderCalendarEntryChip(entry, onOpenEntry))}
                {dayEntries.length > 3 && (
                  <span className="hubly-cal-more">+{dayEntries.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
