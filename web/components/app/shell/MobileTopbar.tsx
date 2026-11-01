"use client";

import Link from "next/link";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { HublyCloseIcon as X, HublyMenuIcon as Menu, HublySearchIcon as Search } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import type { BrandWorkspace } from "@/lib/types";

interface MobileTopbarProps {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  activeBrand?: BrandWorkspace;
  withQuery: (href: string) => string;
}

/** Barra superior por debajo de 768px: menú, logo, marca activa y accesos rápidos. */
export function MobileTopbar({ drawerOpen, onToggleDrawer, activeBrand, withQuery }: MobileTopbarProps) {
  const brands = useHublyStore((s) => s.brands);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);

  return (
    <header
      className="hubly-mobile-topbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        height: 54,
        padding: "0 12px",
        background: "var(--ui-surface)",
        borderBottom: "1px solid var(--ui-border)",
        position: "sticky",
        top: 0,
        zIndex: 45,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <button
          type="button"
          onClick={onToggleDrawer}
          className="hubly-icon-btn hb-icon-btn"
          aria-label="Abrir menú de navegación"
          aria-expanded={drawerOpen}
          aria-controls="hubly-sidebar-nav"
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-surface-2)",
            color: "var(--ui-text)",
            flexShrink: 0,
          }}
        >
          {drawerOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        <Link
          href={withQuery("/dashboard")}
          className="hubly-logo-serif hb-logo-serif"
          aria-label="Hubly Inicio"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ui-text)",
            textDecoration: "none",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          <HublyBrandLogo height={30} />
        </Link>
      </div>

      {/* Compact Mobile Brand Selector + Quick Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        {activeBrand && (
          <button
            type="button"
            onClick={() => {
              const activeList = brands.filter((b) => b.status !== "archived");
              if (activeList.length > 1) {
                const idx = activeList.findIndex((b) => b.id === activeBrand.id);
                const nextBrand = activeList[(idx + 1) % activeList.length];
                if (nextBrand) setActiveBrand(nextBrand.id);
              } else {
                setNewBrandModalOpen(true);
              }
            }}
            aria-label={`Marca activa: ${activeBrand.name}. Toca para cambiar de marca`}
            title={`Marca activa: ${activeBrand.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 30,
              padding: "0 9px",
              borderRadius: 9999,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface-2)",
              color: "var(--ui-text)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: activeBrand.color || "#16324F",
                color: "#FFFFFF",
                fontSize: 8.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {activeBrand.initials}
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeBrand.name}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setAiDrawerOpen(true)}
          className="hubly-icon-btn hb-icon-btn"
          aria-label="Abrir asistente Hubly"
          title="Hubi"
          style={{ width: 32, height: 32 }}
        >
          <HublyCatAvatar size={20} />
        </button>

        <button
          type="button"
          onClick={() => setCmdkOpen(true)}
          className="hubly-icon-btn hb-icon-btn"
          aria-label="Buscar"
          title="Buscar"
          style={{ width: 32, height: 32 }}
        >
          <Search size={15} />
        </button>
      </div>
    </header>
  );
}
