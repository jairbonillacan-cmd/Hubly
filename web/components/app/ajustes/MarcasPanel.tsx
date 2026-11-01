"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { askConfirm } from "@/components/app/AppDialogHost";
import { HublyArchiveIcon, HublyPlusIcon, HublyRefreshIcon, HublySearchIcon } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { PanelHead } from "./Panel";

export function MarcasPanel() {
  const router = useRouter();
  const agency = useHublyStore((s) => s.agency);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updateAgency = useHublyStore((s) => s.updateAgency);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const resetDemoData = useHublyStore((s) => s.resetDemoData);

  const [name, setName] = useState(agency?.name || "");
  const [timezone, setTimezone] = useState(agency?.timezone || "America/Mexico_City");
  const [currency, setCurrency] = useState(agency?.currency || "MXN");
  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (agency?.name) setName(agency.name);
  }, [agency?.name]);

  const dirty =
    name.trim() !== "" &&
    (name.trim() !== agency?.name || timezone !== agency?.timezone || currency !== agency?.currency);
  const q = query.trim().toLowerCase();
  const visible = brands.filter((b) => Boolean(b.archived) === archived && (!q || b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q)));
  const archivedCount = brands.filter((b) => b.archived).length;

  return (
    <section className="hubly-ajustes-panel" aria-label="Marcas">
      <PanelHead
        title="Marcas"
        subtitle="Administra las marcas de tu agencia: crea, archiva o restaura"
        actions={
          <button type="button" className="hbtn hbtn-secondary" onClick={() => setNewBrandModalOpen(true)}>
            <HublyPlusIcon size={17} /> Nueva marca
          </button>
        }
      />

      <div className="hubly-ajustes-section">
        <div className="hubly-ajustes-inline">
          <label className="hubly-ajustes-inline" style={{ flex: "1 1 220px" }}>
            <HublySearchIcon size={17} />
            <input className="hubly-cal-line" value={query} placeholder="Buscar marca…" aria-label="Buscar marca" onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="hubly-cal-types is-2" role="radiogroup" aria-label="Estado de las marcas" style={{ flex: "0 1 280px" }}>
            <button type="button" role="radio" aria-checked={!archived} onClick={() => setArchived(false)}>Activas</button>
            <button type="button" role="radio" aria-checked={archived} onClick={() => setArchived(true)}>Archivadas ({archivedCount})</button>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="hubly-ajustes-empty">
            <strong>{q ? "Sin resultados con estos filtros" : archived ? "Sin marcas archivadas" : "Sin marcas activas"}</strong>
            <p>{q ? "Prueba con otro nombre o cambia el filtro." : archived ? "Las marcas que archives aparecerán aquí." : "Crea una marca para empezar."}</p>
          </div>
        ) : (
          <div className="hubly-ajustes-list">
            {visible.map((b) => {
              const isActive = !b.archived && b.id === activeBrandId;
              return (
                <div key={b.id} className="hubly-ajustes-row">
                  <span className="hubly-ajustes-dot" style={{ background: b.color, color: "var(--on-accent)" }}>{b.initials}</span>
                  <div className="hubly-ajustes-row-text">
                    <div className="hubly-ajustes-row-title" title={b.name}>{b.name}</div>
                    <div className="hubly-ajustes-row-meta">{b.industry}{isActive ? " · Marca activa" : ""}</div>
                  </div>
                  <div className="hubly-ajustes-row-actions">
                    {!b.archived && (
                      <button type="button" className="hbtn hbtn-secondary hbtn-sm" onClick={() => { setActiveBrand(b.id); router.push("/marca"); }}>Configurar</button>
                    )}
                    <button
                      type="button"
                      className="hbtn hbtn-ghost hbtn-sm hbtn-ic"
                      disabled={isActive}
                      title={isActive ? "Cambia de marca activa para archivarla" : b.archived ? "Restaurar" : "Archivar"}
                      aria-label={`${b.archived ? "Restaurar" : "Archivar"} ${b.name}`}
                      onClick={() => updateBrand(b.id, { archived: !b.archived, status: b.archived ? undefined : "archived" })}
                    >
                      <HublyArchiveIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        className="hubly-ajustes-section"
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty) return;
          updateAgency({ name: name.trim(), timezone, currency });
          updateProfile({ timezone });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      >
        <p className="hubly-ajustes-label">Agencia</p>
        <div className="hubly-cal-modal-fields">
          <label className="hubly-cal-field">
            <span>Nombre de la agencia</span>
            <input className="hubly-cal-line" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          </label>
          <label className="hubly-cal-field">
            <span>Zona horaria</span>
            <input className="hubly-cal-line" value={timezone} onChange={(e) => { setTimezone(e.target.value); setSaved(false); }} />
          </label>
          <label className="hubly-cal-field">
            <span>Moneda</span>
            <input className="hubly-cal-line" value={currency} onChange={(e) => { setCurrency(e.target.value); setSaved(false); }} />
          </label>
        </div>
        <div className="hubly-ajustes-inline">
          <button type="submit" className="hbtn hbtn-secondary" disabled={!dirty}>{saved ? "Guardado" : "Guardar"}</button>
          <span role="status" className="hubly-ajustes-hint" hidden={!saved}>Los cambios de la agencia se guardaron.</span>
        </div>
      </form>

      {!backendEnabled && (
        <div className="hubly-ajustes-section">
          <p className="hubly-ajustes-label">Datos de demostración</p>
          <p className="hubly-ajustes-hint">Devuelve marcas, posts y tareas de ejemplo a su estado original.</p>
          <div className="hubly-ajustes-inline">
            <button
              type="button"
              className="hbtn hbtn-secondary"
              onClick={async () => {
                if (!(await askConfirm("¿Restaurar los datos de demostración? Se pierde lo que cambiaste.", "Restaurar"))) return;
                resetDemoData();
                setRestored(true);
                window.setTimeout(() => setRestored(false), 2200);
              }}
            >
              <HublyRefreshIcon size={17} /> Restaurar datos
            </button>
            <span role="status" className="hubly-ajustes-hint" hidden={!restored}>Datos restaurados</span>
          </div>
        </div>
      )}
    </section>
  );
}
