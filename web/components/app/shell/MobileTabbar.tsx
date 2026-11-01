"use client";

import Link from "next/link";
import { BullseyeFilledIcon, HashBoldIcon, HublyCatAvatar, NotebookIcon } from "@/components/app/icons/HublyIcons";
import { HublyMenuIcon as Menu } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";

interface MobileTabbarProps {
  onOpenDrawer: () => void;
  withQuery: (href: string) => string;
  isNavActive: (href: string) => boolean;
}

/** Barra inferior por debajo de 768px. */
export function MobileTabbar({ onOpenDrawer, withQuery, isNavActive }: MobileTabbarProps) {
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);

  return (
    <nav
      aria-label="Barra de navegación inferior móvil"
      className="hubly-mobile-tabbar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "var(--ui-surface)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--ui-border)",
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        alignItems: "center",
        padding: "0 4px",
        zIndex: 46,
      }}
    >
      <Link
        href={withQuery("/tareas")}
        aria-current={isNavActive("/tareas") ? "page" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          textDecoration: "none",
          fontSize: 10.5,
          fontWeight: isNavActive("/tareas") ? 700 : 500,
          color: isNavActive("/tareas") ? "var(--ui-accent-text)" : "var(--ui-text-4)",
        }}
      >
        <NotebookIcon active={isNavActive("/tareas")} />
        <span>Mi espacio</span>
      </Link>

      <Link
        href={withQuery("/parrillas")}
        aria-current={isNavActive("/parrillas") ? "page" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          textDecoration: "none",
          fontSize: 10.5,
          fontWeight: isNavActive("/parrillas") ? 700 : 500,
          color: isNavActive("/parrillas") ? "var(--ui-accent-text)" : "var(--ui-text-4)",
        }}
      >
        <HashBoldIcon active={isNavActive("/parrillas")} />
        <span>Social</span>
      </Link>

      <button
        type="button"
        onClick={() => setAiDrawerOpen(true)}
        aria-label="Abrir asistente Hubly"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          border: "none",
          background: "transparent",
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--ui-text)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9999,
            background: "var(--ui-sky-soft)",
            border: "1.5px solid var(--hb-accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <HublyCatAvatar size={24} />
        </span>
        <span>Hubi</span>
      </button>

      <Link
        href={withQuery("/anuncios")}
        aria-current={isNavActive("/anuncios") ? "page" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          textDecoration: "none",
          fontSize: 10.5,
          fontWeight: isNavActive("/anuncios") ? 700 : 500,
          color: isNavActive("/anuncios") ? "var(--ui-accent-text)" : "var(--ui-text-4)",
        }}
      >
        <BullseyeFilledIcon active={isNavActive("/anuncios")} />
        <span>Ads</span>
      </Link>

      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Más opciones de navegación"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          border: "none",
          background: "transparent",
          fontSize: 10.5,
          fontWeight: 500,
          color: "var(--ui-text-4)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Menu size={16} />
        <span>Más</span>
      </button>
    </nav>
  );
}
