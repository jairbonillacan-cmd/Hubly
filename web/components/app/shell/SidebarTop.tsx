"use client";

import Link from "next/link";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useHublyStore } from "@/lib/store";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import { HublyCatAvatar, HublyHomeIcon, ChatBubbleIcon } from "@/components/app/icons/HublyIcons";
import {
  HublyBellIcon as Bell,
  HublyChevronDownIcon as ChevronDown,
  HublyCloseIcon as X,
} from "@/components/app/icons/DuotoneIcons";
import type { BrandWorkspace } from "@/lib/types";
import { NotificationsPopover } from "./NotificationsPopover";

export type SidebarTab = "inicio" | "hubi" | "chats";

interface SidebarTopProps {
  isEffectiveCollapsed: boolean;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
  activeSidebarTab: SidebarTab;
  setSidebarTab: Dispatch<SetStateAction<SidebarTab>>;
  setBrandMenuOpen: Dispatch<SetStateAction<boolean>>;
  notificationsOpen: boolean;
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>;
  notificationsRef: RefObject<HTMLDivElement | null>;
  activeBrand?: BrandWorkspace;
  withQuery: (href: string) => string;
}

/** Logo, pestañas rápidas y campana del sidebar, expandido o retraído. */
export function SidebarTop({
  isEffectiveCollapsed,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  activeSidebarTab,
  setSidebarTab,
  setBrandMenuOpen,
  notificationsOpen,
  setNotificationsOpen,
  notificationsRef,
  activeBrand,
  withQuery,
}: SidebarTopProps) {
  const notifications = useHublyStore((s) => s.notifications);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <>
    {!isEffectiveCollapsed ? (
      <div className="hubly-sidebar-keep">
        {/* "hubly" Wordmark Header + Close Drawer Button on Mobile */}
        <div
          style={{
            padding: "0 6px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href={withQuery("/dashboard")}
            className="hubly-logo-serif hb-logo-serif"
            aria-label="Hubly · Ir al Dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            <HublyBrandLogo height={26} />
          </Link>

          {activeSidebarTab !== "inicio" && activeBrand && !mobileDrawerOpen && (
            <button
              type="button"
              className="hubly-sidebar-brand"
              onClick={() => {
                setSidebarTab("inicio");
                setBrandMenuOpen(true);
              }}
            >
              <i style={{ background: activeBrand.color || "var(--hb-accent)" }} />
              <span>{activeBrand.name}</span>
              <ChevronDown size={12} />
            </button>
          )}

          {mobileDrawerOpen && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="hubly-icon-btn hb-icon-btn"
              aria-label="Cerrar menú de navegación"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Icon Bar below logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2px 6px",
            position: "relative",
          }}
          ref={notificationsRef}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(
              [
                { id: "inicio", label: "Inicio", icon: <HublyHomeIcon size={16} /> },
                { id: "hubi", label: "Hubi", icon: <HublyCatAvatar size={18} /> },
                { id: "chats", label: "Chats", icon: <ChatBubbleIcon size={16} /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="hubly-sidebar-tab"
                aria-pressed={activeSidebarTab === tab.id}
                aria-label={tab.label}
                title={tab.label}
                onClick={() => setSidebarTab(tab.id)}
              >
                {tab.icon}
                {activeSidebarTab === tab.id && <span>{tab.label}</span>}
              </button>
            ))}
          </div>

          {/* Right-aligned Bell Notification Icon with Dynamic Unread Badge */}
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="hubly-icon-btn hb-icon-btn"
            aria-label={
              unreadNotificationsCount > 0
                ? `Notificaciones (${unreadNotificationsCount} sin leer)`
                : "Notificaciones"
            }
            aria-expanded={notificationsOpen}
            title={
              unreadNotificationsCount > 0
                ? `Notificaciones (${unreadNotificationsCount} sin leer)`
                : "Notificaciones"
            }
            style={{ position: "relative" }}
          >
            <Bell size={15} style={{ color: "var(--ui-text-5)" }} />
            {unreadNotificationsCount > 0 && (
              <span
                data-testid="sidebar-notifications-badge"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  minWidth: 14,
                  height: 14,
                  padding: "0 3px",
                  borderRadius: 9999,
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: "14px",
                  textAlign: "center",
                  boxShadow: "0 0 0 1.5px #FFFFFF",
                }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Popover */}
          {notificationsOpen && <NotificationsPopover />}
        </div>
      </div>
    ) : (
      /* Collapsed Top Header (68px rail) */
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <Link
          href={withQuery("/dashboard")}
          aria-label="Hubly · Inicio"
          title="Hubly · Inicio"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <HublyBrandLogo kind="isotipo" height={26} />
        </Link>

        <button
          type="button"
          onClick={() => setNotificationsOpen((prev) => !prev)}
          className="hubly-icon-btn hb-icon-btn"
          aria-label={
            unreadNotificationsCount > 0
              ? `Notificaciones (${unreadNotificationsCount} sin leer)`
              : "Notificaciones"
          }
          title={
            unreadNotificationsCount > 0
              ? `Notificaciones (${unreadNotificationsCount} sin leer)`
              : "Notificaciones"
          }
          style={{ position: "relative" }}
        >
          <Bell size={15} style={{ color: "var(--ui-text-5)" }} />
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: "var(--hb-accent)",
              }}
            />
          )}
        </button>
      </div>
    )}

    </>
  );
}
