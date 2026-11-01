"use client";

import { useEffect, useState } from "react";
import { HublyCheckIcon, HublyMailIcon, HublyPencilIcon } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { useHublyTheme } from "@/lib/theme";
import { ChangePassword } from "./ChangePassword";
import { FotoPerfil } from "./FotoPerfil";
import { PanelHead } from "./Panel";

export function PerfilPanel() {
  const profile = useHublyStore((s) => s.profile);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const { theme, setTheme } = useHublyTheme();
  const [name, setName] = useState(profile?.name || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name); // eslint-disable-line react-hooks/set-state-in-effect -- el nombre llega después de montar
  }, [profile?.name]);

  const clean = name.trim();
  const dirty = clean !== "" && clean !== profile?.name;

  return (
    <section className="hubly-ajustes-panel" aria-label="Mi perfil">
      <PanelHead title="Mi perfil" subtitle="Tu información personal en la plataforma" />
      <FotoPerfil />

      <form
        className="hubly-ajustes-section"
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty) return;
          updateProfile({ name: clean });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      >
        <label className="hubly-cal-field">
          <span>Nombre completo</span>
          <div className="hubly-ajustes-inline">
            <input className="hubly-cal-line" value={name} placeholder="Tu nombre" onChange={(e) => { setName(e.target.value); setSaved(false); }} />
            <button type="submit" className="hbtn hbtn-secondary" disabled={!dirty}>
              {saved ? <HublyCheckIcon size={17} /> : <HublyPencilIcon size={17} />}
              {saved ? "Guardado" : "Guardar"}
            </button>
          </div>
        </label>
        <span role="status" className="hubly-ajustes-hint" hidden={!saved}>Tu nombre se actualizó.</span>
      </form>

      <label className="hubly-cal-field">
        <span>Correo electrónico</span>
        <div className="hubly-ajustes-inline">
          <HublyMailIcon size={17} />
          <input className="hubly-cal-line" value={profile?.email || ""} disabled readOnly />
        </div>
        <small>El correo no se puede cambiar desde aquí</small>
      </label>

      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Contraseña</p>
        <ChangePassword />
      </div>

      <div className="hubly-ajustes-section">
        <p className="hubly-ajustes-label">Apariencia</p>
        <div className="hubly-cal-types is-2" role="radiogroup" aria-label="Tema">
          <button type="button" role="radio" aria-checked={theme === "light"} onClick={() => setTheme("light")}>Claro</button>
          <button type="button" role="radio" aria-checked={theme === "dark"} onClick={() => setTheme("dark")}>Oscuro</button>
        </div>
      </div>
    </section>
  );
}
