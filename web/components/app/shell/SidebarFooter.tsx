"use client";

import Link from "next/link";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { backendEnabled } from "@/lib/supabase/config";
import { useHublyStore } from "@/lib/store";
import { useHublyTheme } from "@/lib/theme";
import {
  HublyHeadsetIcon,
  HublyMoonIcon as Moon,
  HublySearchIcon as Search,
  HublySettingsIcon as Settings,
  HublySunIcon as Sun,
} from "@/components/app/icons/DuotoneIcons";
import { ProfilePopover } from "./ProfilePopover";

interface SidebarFooterProps {
  isEffectiveCollapsed: boolean;
  profileMenuOpen: boolean;
  setProfileMenuOpen: Dispatch<SetStateAction<boolean>>;
  profilePopoverRef: RefObject<HTMLDivElement | null>;
  withQuery: (href: string) => string;
}

/** Tema, soporte, búsqueda y fila de perfil al pie del sidebar. */
export function SidebarFooter({ isEffectiveCollapsed, profileMenuOpen, setProfileMenuOpen, profilePopoverRef, withQuery }: SidebarFooterProps) {
  const profile = useHublyStore((s) => s.profile);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const { theme, toggleTheme } = useHublyTheme();

  return (
    <div
      ref={profilePopoverRef}
      style={{
        marginTop: "auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: isEffectiveCollapsed ? "center" : "stretch",
        position: "relative",
      }}
    >
      {/* Utility Row: Sun, Headset, Search */}
      <div
        style={{
          display: "flex",
          flexDirection: isEffectiveCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: isEffectiveCollapsed ? "center" : "space-between",
          gap: isEffectiveCollapsed ? 8 : 0,
          padding: isEffectiveCollapsed ? "4px 0 10px" : "2px 6px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isEffectiveCollapsed ? "column" : "row",
            alignItems: "center",
            gap: isEffectiveCollapsed ? 8 : 14,
          }}
        >
          {/* Modo claro / oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hubly-icon-btn hb-icon-btn"
            aria-label="Cambiar tema"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Headset Icon */}
          <button
            type="button"
            onClick={() => setAiDrawerOpen(true)}
            className="hubly-icon-btn hb-icon-btn"
            aria-label="Soporte de Hubly"
            title="Soporte"
          >
            <HublyHeadsetIcon size={18} />
          </button>
        </div>

        {/* Search Icon -> opens CommandPaletteModal */}
        <button
          type="button"
          onClick={() => setCmdkOpen(true)}
          className="hubly-icon-btn hb-icon-btn"
          aria-label="Buscar"
          title="Buscar"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Divider + Dynamic User Profile Row */}
      {!isEffectiveCollapsed && (
        <div
          style={{
            height: 1,
            background: "var(--ui-muted)",
            margin: "0 2px 10px",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isEffectiveCollapsed ? "center" : "space-between",
          padding: isEffectiveCollapsed ? "2px 0" : "2px 4px",
        }}
      >
        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          aria-label={`Perfil de ${profile.name} (${profile.role}). Clic para editar perfil${backendEnabled ? "" : " o espacio de trabajo"}`}
          aria-expanded={profileMenuOpen}
          data-testid="sidebar-profile-trigger"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            minWidth: 0,
          }}
        >
          {/* Dynamic Gold Avatar Circle */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              background: profile.avatarUrl ? `var(--hb-accent) center / cover url(${profile.avatarUrl})` : "var(--hb-accent)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {profile.avatarUrl ? null : profile.avatarInitial}
          </div>

          {!isEffectiveCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div
                data-testid="sidebar-profile-name"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ui-text)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.name}
              </div>
              <div
                data-testid="sidebar-profile-role"
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "var(--ui-text-5)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.role}
              </div>
            </div>
          )}
        </button>

        {!isEffectiveCollapsed && (
          <Link
            href={withQuery("/ajustes")}
            className="hubly-icon-btn hb-icon-btn"
            aria-label="Ir a Ajustes"
            title="Ajustes"
          >
            <Settings size={18} />
          </Link>
        )}
      </div>

      {/* Quick Profile & Workspace Switcher Popover */}
      {profileMenuOpen && <ProfilePopover onClose={() => setProfileMenuOpen(false)} />}
    </div>
  );
}
