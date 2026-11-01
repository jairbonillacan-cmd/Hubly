"use client";

import { useEffect, useState } from "react";
import { PanelHead, Previsto, Switch } from "./Panel";

const KEY = "hubly:preferencias-avisos";
const OPTIONS = [
  { id: "menciones", title: "Menciones y comentarios", meta: "Cuando alguien te nombra en un post o una tarea", on: true },
  { id: "clientes", title: "Aprobaciones de clientes", meta: "Cuando aprueban, rechazan o piden cambios", on: true },
  { id: "publicaciones", title: "Publicaciones", meta: "Posts que fallan y cuentas por caducar", on: true },
  { id: "tareas", title: "Tareas asignadas", meta: "Cuando te asignan algo o se vence", on: true },
  { id: "resumen", title: "Resumen diario", meta: "Un correo a las 8:00 con lo que quedó sin leer", on: false },
];

type Prefs = Record<string, boolean>;
const defaults = (): Prefs => Object.fromEntries(OPTIONS.map((o) => [o.id, o.on]));

export function NotificacionesPanel() {
  const [prefs, setPrefs] = useState<Prefs>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...defaults(), ...JSON.parse(raw) });
    } catch {
      // El almacenamiento del navegador puede estar lleno o bloqueado: seguir sin él no rompe nada.
    }
  }, []);

  const set = (id: string, on: boolean) =>
    setPrefs((p) => {
      const next = { ...p, [id]: on };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // El almacenamiento del navegador puede estar lleno o bloqueado: seguir sin él no rompe nada.
      }
      return next;
    });

  return (
    <section className="hubly-ajustes-panel" aria-label="Notificaciones">
      <PanelHead title="Notificaciones" subtitle="Elige qué avisos quieres recibir" actions={<Previsto />} />
      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Qué te llega por correo</p>
        <div className="hubly-ajustes-list">
          {OPTIONS.map((o) => (
            <div key={o.id} className="hubly-ajustes-row">
              <div className="hubly-ajustes-row-text">
                <div className="hubly-ajustes-row-title">{o.title}</div>
                <div className="hubly-ajustes-row-meta">{o.meta}</div>
              </div>
              <Switch on={prefs[o.id]} label={o.title} onChange={(on) => set(o.id, on)} />
            </div>
          ))}
        </div>
        <p className="hubly-ajustes-hint">Aún no enviamos correos. Tus preferencias quedan guardadas en este navegador.</p>
      </div>
    </section>
  );
}
