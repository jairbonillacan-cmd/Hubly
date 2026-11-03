"use client";

import { useHublyStore } from "@/lib/store";
import { HublyCheckIcon as Check, HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";

/** Lista para cambiar la marca activa, debajo del selector del sidebar. */
export function BrandMenu({
  state,
  activeBrandId,
  onClose,
}: {
  state: "open" | "closing";
  activeBrandId: string;
  onClose: () => void;
}) {
  const brands = useHublyStore((s) => s.brands);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  return (
    <div
      className="hubly-dropdown hubly-shell-pop"
      data-state={state}
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
      zIndex: "var(--layer-dropdown)",
      }}
    >
      {brands
        .filter((b) => b.status !== "archived")
        .map((b) => {
          const isCurrent = b.id === activeBrandId;
          return (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={isCurrent}
              onClick={() => {
                setActiveBrand(b.id);
                onClose();
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
                background: isCurrent ? "var(--ui-sky-soft)" : "transparent",
                color: isCurrent ? "var(--ui-accent-text)" : "var(--ui-text-2)",
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
                    background:
                      b.color || "var(--hb-accent)",
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
                <Check size={13} style={{ color: "var(--ui-accent-text-2)", flexShrink: 0 }} />
              )}
            </button>
          );
        })}

      <button
        type="button"
        onClick={() => {
          onClose();
          setNewBrandModalOpen(true);
        }}
        style={{
          width: "100%",
          marginTop: 4,
          padding: "7px 9px",
          borderRadius: 8,
          border: "1px dashed var(--ui-border-strong)",
          background: "transparent",
          color: "var(--hb-accent-text)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontFamily: "inherit",
        }}
      >
        <Plus size={12} /> Nueva marca
      </button>
    </div>
  );
}
