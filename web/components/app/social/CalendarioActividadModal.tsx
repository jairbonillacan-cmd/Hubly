"use client";

import React, { useState } from "react";
import { useHublyStore } from "@/lib/store";
import { Button } from "@/components/app/ui/Button";
import { Field } from "@/components/app/ui/Field";
import { Modal } from "@/components/app/ui/Modal";
import {
  ACTIVITY_COLORS,
  DEFAULT_ACTIVITY_COLOR,
  REPEAT_OPTIONS,
  addMinutesToTime,
  type CalendarActivity,
  type RepeatMode,
} from "@/lib/domain/posts";
import {
  HublyCalendarIcon as CalendarPlus,
  HublyCameraIcon as Camera,
  HublyClipboardIcon as ListChecks,
  HublyCloseIcon as X,
} from "@/components/app/icons/DuotoneIcons";

const ACTIVITY_TYPES = [
  { id: "Junta", Icon: ListChecks },
  { id: "Grabación", Icon: Camera },
  { id: "Actividad", Icon: CalendarPlus },
] as const;

const DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "2 h", minutes: 120 },
] as const;

interface CalendarioActividadModalProps {
  openDate: string | null;
  lastOpenDate: string;
  onChangeDate: (isoDate: string) => void;
  onClose: () => void;
  onSave: (draft: Omit<CalendarActivity, "id" | "isoDate">) => void;
}

export function CalendarioActividadModal({
  openDate,
  lastOpenDate,
  onChangeDate,
  onClose,
  onSave,
}: CalendarioActividadModalProps) {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const [wasOpen, setWasOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState<string>(ACTIVITY_TYPES[0].id);
  const [draftTime, setDraftTime] = useState("09:00");
  const [draftEndTime, setDraftEndTime] = useState("");
  const [draftAllDay, setDraftAllDay] = useState(false);
  const [draftRepeat, setDraftRepeat] = useState<RepeatMode>("none");
  const [draftColor, setDraftColor] = useState<string | null>(null);
  const [draftPlace, setDraftPlace] = useState("");
  const [draftBrandId, setDraftBrandId] = useState(activeBrandId);

  const isOpen = openDate !== null;
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDraftTitle("");
      setDraftBrandId("");
      setDraftEndTime("");
      setDraftAllDay(false);
      setDraftRepeat("none");
      setDraftColor(null);
      setDraftPlace("");
      setDraftCategory(ACTIVITY_TYPES[0].id);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title || !openDate) return;
    onSave({
      brandId: draftBrandId,
      title,
      category: draftCategory,
      time: draftTime,
      endTime: draftEndTime,
      allDay: draftAllDay,
      repeat: draftRepeat,
      color: draftColor || undefined,
      place: draftPlace.trim(),
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose} label="Nueva actividad" onSubmit={handleSubmit}>
      <div className="hubly-cal-modal-head">
        <h2>
          <i style={{ background: draftColor || DEFAULT_ACTIVITY_COLOR }} />
          Nueva actividad
        </h2>
        <button
          type="button"
          className="hubly-cal-modal-close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="hubly-cal-modal-scroll">
        <Field label="Título">
          <input
            className="hubly-cal-line"
            autoFocus
            required
            placeholder="Ej. Grabación con cliente"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
          />
        </Field>

        <div className="hubly-cal-types" role="radiogroup" aria-label="Tipo de actividad">
          {ACTIVITY_TYPES.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={draftCategory === id}
              onClick={() => setDraftCategory(id)}
            >
              <Icon size={18} />
              <span>{id}</span>
            </button>
          ))}
        </div>

        <div className="hubly-cal-field">
          <span>Cuándo</span>
          <input
            className="hubly-cal-line"
            type="date"
            aria-label="Fecha"
            value={openDate ?? lastOpenDate}
            onChange={(e) => onChangeDate(e.target.value)}
          />
          {!draftAllDay && (
            <>
              <input
                className="hubly-cal-line"
                type="time"
                aria-label="Hora de inicio"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
              />
              <small>a</small>
              <input
                className="hubly-cal-line"
                type="time"
                aria-label="Hora de fin"
                value={draftEndTime}
                onChange={(e) => setDraftEndTime(e.target.value)}
              />
            </>
          )}
          <div className="hubly-cal-durations">
            {!draftAllDay &&
              DURATION_PRESETS.map(({ label, minutes }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDraftEndTime(addMinutesToTime(draftTime, minutes))}
                >
                  {label}
                </button>
              ))}
            <label>
              <input
                type="checkbox"
                checked={draftAllDay}
                onChange={(e) => setDraftAllDay(e.target.checked)}
              />
              Todo el día
            </label>
          </div>
        </div>

        <div className="hubly-cal-field">
          <span>Repetir</span>
          <div className="hubly-cal-pills">
            {REPEAT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className="hubly-cal-pill"
                aria-pressed={draftRepeat === id}
                onClick={() => setDraftRepeat(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="hubly-cal-field">
          <span>Color</span>
          <div className="hubly-cal-colors">
            <button
              type="button"
              className="hubly-cal-pill"
              aria-pressed={draftColor === null}
              onClick={() => setDraftColor(null)}
            >
              <i />
              Auto
            </button>
            {ACTIVITY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="hubly-cal-color"
                aria-label={`Color ${color}`}
                aria-pressed={draftColor === color}
                style={{ background: color }}
                onClick={() => setDraftColor(color)}
              />
            ))}
          </div>
        </div>

        <label className="hubly-cal-field">
          <span>Marca (opcional)</span>
          <select
            className="hubly-cal-line"
            value={draftBrandId}
            onChange={(e) => setDraftBrandId(e.target.value)}
          >
            <option value="">Ninguna — actividad general</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="hubly-cal-field">
          <span>Lugar / link (opcional)</span>
          <input
            className="hubly-cal-line"
            placeholder="Oficina, Meet, dirección…"
            value={draftPlace}
            onChange={(e) => setDraftPlace(e.target.value)}
          />
        </label>
      </div>

      <div className="hubly-cal-modal-actions">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Crear actividad
        </Button>
      </div>
    </Modal>
  );
}
