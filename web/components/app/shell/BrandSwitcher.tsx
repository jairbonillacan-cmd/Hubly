"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyBuildingIcon,
  HublyCheckIcon as Check,
  HublyChevronDownIcon as ChevronDown,
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";
import type { BrandWorkspace } from "@/lib/types";

interface BrandSwitcherProps {
  activeBrand: BrandWorkspace;
  brandMenuOpen: boolean;
  setBrandMenuOpen: Dispatch<SetStateAction<boolean>>;
  brandDropdownRef: RefObject<HTMLDivElement | null>;
}

/** Marca activa, accesos de equipo y menú para cambiar de marca. */
export function BrandSwitcher({ activeBrand, brandMenuOpen, setBrandMenuOpen, brandDropdownRef }: BrandSwitcherProps) {
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const brandMenuPresence = useModalPresence(brandMenuOpen, 100);

  return (
    <div ref={brandDropdownRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 6px 8px",
        }}
      >
        {/* Left: Brand Badge + Active Brand Name + Chevron */}
        <button
          type="button"
          onClick={() => setBrandMenuOpen((prev) => !prev)}
          aria-label={`Cambiar marca activa (${activeBrand.name})`}
          aria-expanded={brandMenuOpen}
          aria-haspopup="listbox"
          data-testid="sidebar-brand-switcher"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "none",
            padding: "2px 4px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: activeBrand.color || "var(--hb-accent)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HublyBuildingIcon size={13} style={{ color: "#FFFFFF" }} />
          </span>

          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--ui-text-1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activeBrand.name}
          </span>

          <ChevronDown size={12} style={{ color: "var(--ui-text-5)", flexShrink: 0 }} />
        </button>

        {/* Right: Dynamic User Initials Circle + Dashed + Button (Invitar a la agencia) */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            title={profile.name}
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              background: profile.avatarUrl ? `var(--hb-accent) center / cover url(${profile.avatarUrl})` : "var(--hb-accent)",
              color: "#FFFFFF",
              fontSize: 8.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile.avatarUrl ? null : profile.avatarInitial}
          </span>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            aria-label="Invitar a la agencia"
            title="Invitar a la agencia"
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              border: "1px dashed var(--ui-border-strong)",
              background: "transparent",
              color: "var(--ui-text-5)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* Brand Switcher Dropdown Menu */}
      {brandMenuPresence.mounted && (
        <div
          className="hubly-dropdown"
          data-state={brandMenuPresence.state}
          role="listbox"
          aria-label="Seleccionar marca activa"
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 4,
            right: 4,
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 12,
            padding: 6,
            zIndex: 65,
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
          }}
        >
          {brands
            .filter((b) => b.status !== "archived")
            .map((b) => {
              const isCurrent = b.id === activeBrand.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setActiveBrand(b.id);
                    setBrandMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 8,
                    border: "none",
                    background: isCurrent ? "rgb(var(--hb-accent-rgb) / 0.08)" : "transparent",
                    color: isCurrent ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: b.color || "var(--hb-accent)",
                        color: "var(--on-accent)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {b.initials}
                    </span>
                    <span
                      style={{
                        fontWeight: isCurrent ? 600 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.name}
                    </span>
                  </span>
                  {isCurrent && (
                    <Check size={15} style={{ color: "var(--hb-accent-text)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}

          <button
            type="button"
            className="hubly-brand-menu-create"
            onClick={() => {
              setBrandMenuOpen(false);
              setNewBrandModalOpen(true);
            }}
          >
            <Plus size={15} /> Crear marca
          </button>
        </div>
      )}
    </div>
  );
}
