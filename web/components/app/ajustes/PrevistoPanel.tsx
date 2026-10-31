"use client";

import { PanelHead, Previsto } from "./Panel";

/** Pantallas de Ajustes que dependen de cobros o servicios que Hubly todavía no tiene. */
export function PrevistoPanel({ title, subtitle, empty, text }: { title: string; subtitle: string; empty: string; text: string }) {
  return (
    <section className="hubly-ajustes-panel" aria-label={title}>
      <PanelHead title={title} subtitle={subtitle} actions={<Previsto />} />
      <div className="hubly-ajustes-empty">
        <strong>{empty}</strong>
        <p>{text}</p>
      </div>
    </section>
  );
}
