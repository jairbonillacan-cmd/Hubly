"use client";

import { Button } from "@/components/app/ui/Button";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { askConfirm } from "@/components/app/AppDialogHost";
import { CuentaPanel } from "@/components/app/ajustes/CuentaPanel";
import { EquipoPanel } from "@/components/app/ajustes/EquipoPanel";
import { IntegracionesPanel } from "@/components/app/ajustes/IntegracionesPanel";
import { MarcasPanel } from "@/components/app/ajustes/MarcasPanel";
import { NotificacionesPanel } from "@/components/app/ajustes/NotificacionesPanel";
import { PerfilPanel } from "@/components/app/ajustes/PerfilPanel";
import { PrevistoPanel } from "@/components/app/ajustes/PrevistoPanel";
import { RolesPanel } from "@/components/app/ajustes/RolesPanel";
import {
  HublyBellIcon,
  HublyBuildingIcon,
  HublyCardIcon,
  HublyChartIcon,
  HublyGiftIcon,
  HublyLogOutIcon,
  HublyPeopleIcon,
  HublyPersonIcon,
  HublyPlugIcon,
  HublyShieldIcon,
} from "@/components/app/icons/DuotoneIcons";
import { clearAllRecoveries } from "@/lib/post-draft";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { backendEnabled } from "@/lib/supabase/config";

type TabId = "perfil" | "cuenta" | "notificaciones" | "integraciones" | "equipo" | "roles" | "marcas" | "facturacion" | "uso" | "recomienda";

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "perfil", label: "Mi perfil", icon: <HublyPersonIcon size={17} /> },
  { id: "cuenta", label: "Mi cuenta", icon: <HublyShieldIcon size={17} /> },
  { id: "notificaciones", label: "Notificaciones", icon: <HublyBellIcon size={17} /> },
  { id: "integraciones", label: "Integraciones", icon: <HublyPlugIcon size={17} /> },
  { id: "equipo", label: "Equipo", icon: <HublyPeopleIcon size={17} /> },
  { id: "roles", label: "Roles", icon: <HublyPersonIcon size={17} /> },
  { id: "marcas", label: "Marcas", icon: <HublyBuildingIcon size={17} /> },
  { id: "facturacion", label: "Suscripción", icon: <HublyCardIcon size={17} /> },
  { id: "uso", label: "Uso", icon: <HublyChartIcon size={17} /> },
  { id: "recomienda", label: "Recomienda Hubly", icon: <HublyGiftIcon size={17} /> },
];

/** Nombres anteriores de la pestaña en la URL, para no romper enlaces guardados. */
const ALIAS: Record<string, TabId> = { "mi-perfil": "perfil", "mi-cuenta": "cuenta", suscripcion: "facturacion" };

const panel = (tab: TabId): ReactNode => {
  switch (tab) {
    case "perfil": return <PerfilPanel />;
    case "cuenta": return <CuentaPanel />;
    case "notificaciones": return <NotificacionesPanel />;
    case "integraciones": return <IntegracionesPanel />;
    case "equipo": return <EquipoPanel />;
    case "roles": return <RolesPanel />;
    case "marcas": return <MarcasPanel />;
    case "facturacion":
      return <PrevistoPanel title="Suscripción" subtitle="Tu plan, método de pago y facturas" empty="Sin plan de pago todavía" text="Los precios de Hubly aún no están decididos, así que no hay nada que cobrar ni cambiar." />;
    case "uso":
      return <PrevistoPanel title="Uso" subtitle="Lo que se consumió este mes" empty="Sin uso que mostrar" text="Cuando el asistente de IA esté disponible con cuentas reales, aquí verás sus corridas y su costo." />;
    case "recomienda":
      return <PrevistoPanel title="Recomienda Hubly" subtitle="Comparte Hubly con otras agencias" empty="Sin programa de referidos" text="Todavía no hay una liga para compartir ni premios por recomendar." />;
  }
};

export default function AjustesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("perfil");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tab") || "";
    const id = ALIAS[raw] ?? raw;
    if (TABS.some((t) => t.id === id)) setTab(id as TabId); // eslint-disable-line react-hooks/set-state-in-effect -- la URL solo existe en el navegador
  }, []);

  useEffect(() => {
    document.querySelector(".hubly-ajustes-tab[aria-current='page']")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  const choose = (id: TabId) => {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };

  const logout = async () => {
    if (!(await askConfirm("¿Seguro que quieres cerrar sesión?", "Cerrar sesión"))) return;
    if (backendEnabled) {
      clearAllRecoveries(localStorage);
      await createSupabaseBrowser().auth.signOut();
      window.location.assign("/");
      return;
    }
    router.push("/");
  };

  return (
    <div className="hubly-ajustes">
      <h1 className="hubly-ajustes-title">Configuración</h1>
      <p className="hubly-ajustes-subtitle">Gestiona tu perfil, equipo y configuración de la agencia</p>

      <div className="hubly-ajustes-grid">
        <nav className="hubly-ajustes-nav" aria-label="Secciones de configuración">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="hubly-ajustes-tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => choose(t.id)}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
          <div className="hubly-ajustes-nav-sep" />
          <Button variant="secondary" size="sm" onClick={() => void logout()}>
            <HublyLogOutIcon size={15} /> Cerrar sesión
          </Button>
        </nav>
        <div>{panel(tab)}</div>
      </div>
    </div>
  );
}
