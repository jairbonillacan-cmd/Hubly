"use client";

import { useEffect, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { hasPendingSave, retryLiveSave, type SaveState } from "@/lib/live-workspace";

const bannerButton = { border: "1px solid #FFFFFF", background: "transparent", color: "#FFFFFF", borderRadius: 7, padding: "2px 8px", cursor: "pointer", fontWeight: 600 } as const;

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
      if (next === "conflict") void syncFromServer();
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
  }, [syncFromServer]);

  if (!backendEnabled) return null;
  if (!hydrated) {
    return (
      <div role="status" style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--ui-surface)", color: "var(--ui-text-3)", display: "grid", placeItems: "center", fontSize: 14 }}>
        Cargando tu agencia…
      </div>
    );
  }
  if (state !== "error" && state !== "conflict" && state !== "readonly") return null;
  return (
    <div role="alert" style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 250, maxWidth: "calc(100vw - 32px)", background: "#B91C1C", color: "#FFFFFF", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "flex", gap: 10, alignItems: "center" }}>
      {state === "error"
        ? "No se pudo guardar tu último cambio."
        : state === "readonly"
          ? "Tienes acceso de solo lectura: este cambio no se guardará."
          : "Otra persona guardó antes. Se cargó su versión; revisa tu último cambio."}
      <button type="button" onClick={state === "error" ? retryLiveSave : () => setState("idle")} style={bannerButton}>
        {state === "error" ? "Reintentar" : "Entendido"}
      </button>
    </div>
  );
}
