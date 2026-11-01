"use client";

import { Button } from "@/components/app/ui/Button";
import { useHublyStore } from "@/lib/store";
import { PanelHead, Previsto } from "./Panel";

const LIVE_ROLES: Record<string, string> = { owner: "Dueño", admin: "Administración", editor: "Edición", viewer: "Solo lectura" };

export function CuentaPanel() {
  const agency = useHublyStore((s) => s.agency);
  const profile = useHublyStore((s) => s.profile);
  const role = useHublyStore((s) => s.role);
  const brands = useHublyStore((s) => s.brands);
  const mine = brands.filter((b) => !b.archived);

  return (
    <section className="hubly-ajustes-panel" aria-label="Mi cuenta">
      <PanelHead title="Mi cuenta" subtitle="Tu agencia y las marcas a las que tienes acceso" />

      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Agencia</p>
        <div className="hubly-ajustes-list">
          <div className="hubly-ajustes-row">
            <span className="hubly-ajustes-dot">{(agency?.name || "A").slice(0, 2).toUpperCase()}</span>
            <div className="hubly-ajustes-row-text">
              <div className="hubly-ajustes-row-title">{agency?.name}</div>
            </div>
            <span className="hubly-ajustes-tag">{(role && LIVE_ROLES[role]) || profile?.role || "Miembro"}</span>
          </div>
        </div>
      </div>

      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Marcas asignadas ({mine.length})</p>
        {mine.length === 0 ? (
          <p className="hubly-ajustes-hint">Sin marcas asignadas</p>
        ) : (
          <div className="hubly-ajustes-list">
            {mine.map((b) => (
              <div key={b.id} className="hubly-ajustes-row">
                <span className="hubly-ajustes-dot" style={{ background: b.color, color: "var(--on-accent)" }}>{b.initials}</span>
                <div className="hubly-ajustes-row-text">
                  <div className="hubly-ajustes-row-title">{b.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Eliminar mi cuenta</p>
        <p className="hubly-ajustes-hint">Saldrías de todas tus agencias y marcas, y tu nombre y correo se borrarían. No se puede deshacer.</p>
        <div className="hubly-ajustes-inline">
          <Button variant="danger" disabled data-planned title="Función prevista">Eliminar mi cuenta</Button>
          <Previsto />
        </div>
      </div>
    </section>
  );
}
