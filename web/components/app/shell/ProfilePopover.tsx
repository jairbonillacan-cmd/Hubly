"use client";

import { useState } from "react";
import {
  HublyBuildingIcon as Building2,
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyGlobeIcon as Globe,
  HublyPersonIcon as User,
} from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";

const TIMEZONE_OPTIONS = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Lima (GMT-5)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "UTC", label: "UTC" },
];

const DEMO_WORKSPACES = [
  { id: "default", label: "Mi Agencia (Principal)", badge: "Principal" },
  { id: "workspace-b", label: "Agencia Norte (Workspace B)", badge: "Demo B" },
];

/** Edición rápida del perfil y, en modo demo, cambio de espacio de trabajo. */
export function ProfilePopover({ onClose }: { onClose: () => void }) {
  const profile = useHublyStore((s) => s.profile);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const workspaceId = useHublyStore((s) => s.workspaceId);
  const switchWorkspace = useHublyStore((s) => s.switchWorkspace);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftRole, setDraftRole] = useState(profile.role);
  const [draftTimezone, setDraftTimezone] = useState(profile.timezone);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = draftName.trim() || profile.name;
    const trimmedRole = draftRole.trim() || profile.role;
    const computedInitials = trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    updateProfile({
      name: trimmedName,
      role: trimmedRole,
      timezone: draftTimezone,
      avatarInitial: computedInitials || profile.avatarInitial || "HU",
    });
    setProfileSavedToast(true);
    window.setTimeout(() => setProfileSavedToast(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-label={backendEnabled ? "Editar perfil" : "Editar perfil y espacio de trabajo"}
      data-testid="sidebar-profile-popover"
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: 0,
        width: 236,
        background: "var(--ui-surface)",
        border: "1px solid var(--ui-border)",
        borderRadius: 16,
        padding: 14,
        zIndex: 70,
        boxShadow: "0 16px 38px rgba(15, 23, 42, 0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ui-text)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <User size={13} style={{ color: "var(--hb-accent-text)" }} />
          Perfil del operador
        </span>
        <button
          type="button"
          onClick={() => onClose()}
          className="hubly-icon-btn hb-icon-btn"
          aria-label="Cerrar menú de perfil"
          style={{ width: 24, height: 24 }}
        >
          <X size={13} />
        </button>
      </div>

      <form
        onSubmit={handleSaveProfile}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <label style={{ display: "block" }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ui-text-4)",
              marginBottom: 3,
            }}
          >
            Nombre
          </span>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="hubly-input saas-input"
            aria-label="Nombre del operador"
            style={{ padding: "6px 10px", fontSize: 12.5 }}
          />
        </label>

        <label style={{ display: "block" }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ui-text-4)",
              marginBottom: 3,
            }}
          >
            Rol
          </span>
          <input
            type="text"
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value)}
            className="hubly-input saas-input"
            aria-label="Rol del operador"
            style={{ padding: "6px 10px", fontSize: 12.5 }}
          />
        </label>

        <label style={{ display: "block" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ui-text-4)",
              marginBottom: 3,
            }}
          >
            <Globe size={11} />
            Zona horaria
          </span>
          <select
            value={draftTimezone}
            onChange={(e) => setDraftTimezone(e.target.value)}
            className="hubly-select saas-select"
            aria-label="Zona horaria"
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="hbtn hbtn-primary hbtn-sm"
          style={{
            width: "100%",
            marginTop: 2,
            height: 32,
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {profileSavedToast ? "¡Perfil actualizado!" : "Guardar perfil"}
        </button>
      </form>

      {/* Los espacios de ejemplo solo existen en modo demo: con cuentas reales pisarían los datos de la agencia. */}
      {!backendEnabled && (
        <>
          <div
            style={{
              height: 1,
              background: "var(--ui-muted)",
              margin: "12px 0 10px",
            }}
          />

          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ui-text-4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Building2 size={11} />
              Espacio de trabajo
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DEMO_WORKSPACES.map((ws) => {
                const isCurrentWs = workspaceId === ws.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      void switchWorkspace(ws.id);
                      onClose();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: isCurrentWs
                        ? "1px solid #BFE2F4"
                        : "1px solid transparent",
                      background: isCurrentWs ? "#F1F9FD" : "transparent",
                      color: isCurrentWs ? "var(--ui-accent-text)" : "var(--ui-text-2)",
                      fontSize: 12,
                      fontWeight: isCurrentWs ? 600 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{ws.label}</span>
                    {isCurrentWs && (
                      <Check size={13} style={{ color: "var(--ui-accent-text-2)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
