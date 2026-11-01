"use client";

import { Button } from "@/components/app/ui/Button";
import { PanelHead, Previsto } from "./Panel";

const ITEMS = [
  { name: "Canva", text: "Trae tus diseños a los posts y a la biblioteca" },
  { name: "Google Drive", text: "Importa archivos de tu Drive sin descargarlos" },
  { name: "Google Calendar", text: "Muestra tus eventos en el calendario" },
];

export function IntegracionesPanel() {
  return (
    <section className="hubly-ajustes-panel" aria-label="Integraciones">
      <PanelHead title="Integraciones" subtitle="Conecta tus cuentas para traer archivos y eventos" actions={<Previsto />} />
      <div className="hubly-ajustes-list">
        {ITEMS.map((i) => (
          <div key={i.name} className="hubly-ajustes-row">
            <div className="hubly-ajustes-row-text">
              <div className="hubly-ajustes-row-title">{i.name}</div>
              <div className="hubly-ajustes-row-meta">{i.text}</div>
            </div>
            <Button variant="secondary" size="sm" disabled data-planned title="Función prevista">Conectar</Button>
          </div>
        ))}
      </div>
    </section>
  );
}
