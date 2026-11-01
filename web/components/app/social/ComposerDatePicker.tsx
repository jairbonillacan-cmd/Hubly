"use client";

import { useState } from "react";
import { addDays, localIsoDate } from "@/lib/date";
import {
  HublyChevronDownIcon,
  HublyChevronLeftIcon,
  HublyChevronRightIcon,
  HublyChevronUpIcon,
} from "@/components/app/icons/DuotoneIcons";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const DEFAULT_TIME = "09:00";
const MINUTE_STEP = 5;

const pad = (n: number) => String(n).padStart(2, "0");
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Las seis semanas que muestra un mes, empezando en lunes. */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1, 12);
  const start = addDays(localIsoDate(first), -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Suma minutos a una hora HH:mm dando la vuelta al día. */
export function shiftTime(time: string, minutes: number): string {
  const [h, m] = (time || DEFAULT_TIME).split(":").map(Number);
  const total = (h * 60 + m + minutes + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** «Sábado 31 de octubre · 09:00», o null sin fecha. */
export function scheduleLabel(date: string, time: string): string | null {
  if (!date) return null;
  const day = new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
  return `${capitalize(day)}${time ? ` · ${time}` : ""}`;
}

export function ComposerDatePicker({
  date,
  time,
  allowPast = false,
  onChange,
  onClose,
}: {
  date: string;
  time: string;
  /** Solo programar exige una fecha futura; un borrador puede quedar apartado en cualquier día. */
  allowPast?: boolean;
  onChange: (date: string, time: string) => void;
  onClose: () => void;
}) {
  const today = localIsoDate();
  const initial = new Date(`${date || today}T12:00:00`);
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const days = monthGrid(cursor.year, cursor.month);
  const period = capitalize(new Date(cursor.year, cursor.month, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })).replace(" de ", " ");
  const shown = time || DEFAULT_TIME;
  const [hours, minutes] = shown.split(":");

  const moveMonth = (offset: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + offset, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  const stepper = (label: string, value: string, delta: number) => (
    <span className="hubly-datepick-step">
      <button type="button" aria-label={`Subir ${label}`} onClick={() => onChange(date, shiftTime(shown, delta))}><HublyChevronUpIcon size={14} /></button>
      <b>{value}</b>
      <button type="button" aria-label={`Bajar ${label}`} onClick={() => onChange(date, shiftTime(shown, -delta))}><HublyChevronDownIcon size={14} /></button>
    </span>
  );

  return (
    <div className="hubly-datepick" role="dialog" aria-label="Elegir fecha y hora">
      <div className="hubly-datepick-head">
        <button type="button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}><HublyChevronLeftIcon size={15} /></button>
        <strong aria-live="polite">{period}</strong>
        <button type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><HublyChevronRightIcon size={15} /></button>
      </div>
      <div className="hubly-datepick-grid" aria-hidden>
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="hubly-datepick-grid">
        {days.map((day) => {
          const d = new Date(`${day}T12:00:00`);
          return (
            <button
              key={day}
              type="button"
              className="hubly-datepick-day"
              disabled={!allowPast && day < today}
              aria-pressed={day === date}
              aria-current={day === today ? "date" : undefined}
              data-outside={d.getMonth() !== cursor.month || undefined}
              aria-label={d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              onClick={() => onChange(day, time || DEFAULT_TIME)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="hubly-datepick-time">
        <small>Hora</small>
        {stepper("hora", hours, 60)}
        <b>:</b>
        {stepper("minutos", minutes, MINUTE_STEP)}
      </div>
      <div className="hubly-datepick-foot">
        <button type="button" className="hbtn hbtn-ghost hbtn-sm" onClick={() => onChange("", "")}>Borrar</button>
        <span />
        <button
          type="button"
          className="hbtn hbtn-ghost hbtn-sm"
          onClick={() => {
            const now = new Date();
            onChange(localIsoDate(now), `${pad(now.getHours())}:${pad(now.getMinutes())}`);
            setCursor({ year: now.getFullYear(), month: now.getMonth() });
          }}
        >
          Ahora
        </button>
        <button type="button" className="hbtn hbtn-primary hbtn-sm" onClick={onClose}>Listo</button>
      </div>
    </div>
  );
}
