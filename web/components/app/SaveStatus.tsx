"use client";

import { useEffect, useState } from "react";
import {
  HublyBellIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyClipboardIcon,
  HublyHashIcon,
  HublyImageIcon,
} from "@/components/app/icons/DuotoneIcons";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { hasPendingSave, keepMyVersion, retryLiveSave, discardMyVersion, type SaveState } from "@/lib/live-workspace";

const bannerButton = { border: "1px solid #FFFFFF", background: "transparent", color: "#FFFFFF", borderRadius: 7, padding: "2px 8px", cursor: "pointer", fontWeight: 600 } as const;

const ICONOS_BASE = [HublyCalendarIcon, HublyHashIcon, HublyImageIcon, HublyChatIcon, HublyBellIcon, HublyChartIcon, HublyClipboardIcon];
const ICONOS_CARGA = [...ICONOS_BASE, ...ICONOS_BASE];

export function HubiCargando() {
  return (
    <div role="status" className="hubly-carga">
      <div className="hubly-carga-lluvia" aria-hidden="true">
        {ICONOS_CARGA.map((Icono, i) => (
          <span key={i}><Icono size={64} /></span>
        ))}
      </div>
      <p className="hubly-carga-texto">Cargando tu agencia…</p>
      <span className="hubly-carga-hubi"><HublyBrandLogo kind="isotipo" height={560} alt="" /></span>
    </div>
  );
}

/** En modo real: bloquea la vista hasta cargar los datos y avisa si un guardado falla. */
export function SaveStatus() {
  const hydrated = useHublyStore((s) => s.hydrated);
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    if (!backendEnabled) return;
    const onState = (e: Event) => {
      const next = (e as CustomEvent<SaveState>).detail;
      setState(next);
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (hasPendingSave()) e.preventDefault();
    };
    window.addEventListener("hubly:save-state", onState);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("hubly:save-state", onState);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  if (!backendEnabled) return null;
  if (!hydrated) {
    return <HubiCargando />;
  }
  if (state !== "error" && state !== "conflict" && state !== "readonly") return null;
  return (
    <div role="alert" style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 250, maxWidth: "calc(100vw - 32px)", background: "#B91C1C", color: "#FFFFFF", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "flex", gap: 10, alignItems: "center" }}>
      {state === "error"
        ? "No se pudo guardar tu último cambio."
        : state === "readonly"
          ? "Tienes acceso de solo lectura: este cambio no se guardará."
          : "Otra persona guardó antes. Tu cambio sigue a salvo en este navegador; elige qué versión conservar."}
      {state === "conflict" ? (
        <>
          <button
            type="button"
            onClick={() => {
              discardMyVersion();
              void syncFromServer();
            }}
            style={bannerButton}
          >
            Usar la del equipo
          </button>
          <button type="button" onClick={() => void keepMyVersion()} style={bannerButton}>
            Reemplazar con la mía
          </button>
        </>
      ) : (
        <button type="button" onClick={state === "error" ? retryLiveSave : () => setState("idle")} style={bannerButton}>
          {state === "error" ? "Reintentar" : "Entendido"}
        </button>
      )}
    </div>
  );
}
