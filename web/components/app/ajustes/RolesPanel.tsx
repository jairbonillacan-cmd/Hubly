"use client";

import { PanelHead, Previsto } from "./Panel";

export const ROLES = [
  { value: "Admin", title: "Admin", text: "Acceso total a marcas, equipo, métricas y configuración" },
  { value: "Content Manager", title: "Content Manager", text: "Gestiona parrillas, calendario, tareas y libretas" },
  { value: "Diseñador", title: "Diseñador", text: "Sube creativos, edita piezas visuales y cierra entregables" },
  { value: "Copywriter", title: "Copywriter", text: "Redacta copies, guiones de Reels y notas de marca" },
  { value: "Trafficker", title: "Trafficker", text: "Administra anuncios, presupuesto y resultados" },
  { value: "Cliente", title: "Cliente", text: "Revisa y aprueba las parrillas que le compartes" },
];

export function RolesPanel() {
  return (
    <section className="hubly-ajustes-panel" aria-label="Roles">
      <PanelHead
        title="Roles"
        subtitle="Decide qué rol tiene cada persona. Asígnalos en Equipo"
        actions={<><Previsto /><button type="button" className="hbtn hbtn-secondary" disabled data-planned title="Función prevista">Crear rol</button></>}
      />
      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Predeterminados</p>
        <div className="hubly-ajustes-list">
          {ROLES.map((r) => (
            <div key={r.value} className="hubly-ajustes-row">
              <div className="hubly-ajustes-row-text">
                <div className="hubly-ajustes-row-title">{r.title}</div>
                <div className="hubly-ajustes-row-meta">{r.text}</div>
              </div>
              <span className="hubly-ajustes-tag">Predeterminado</span>
            </div>
          ))}
        </div>
        <p className="hubly-ajustes-hint">Los roles propios y su matriz de permisos son una función prevista: hoy el rol solo describe el trabajo de cada persona.</p>
      </div>
    </section>
  );
}
