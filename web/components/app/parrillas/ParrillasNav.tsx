"use client";

import {
  HublyLinkIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { ParrillasPageModel } from "./useParrillasPage";

export function ParrillasNav({ view }: { view: ParrillasPageModel }) {
  const { activeTab, setActiveTab, setAccountsModalOpen, navItems } = view;

  return (
    <>
      {/* Top Hubi Sub-Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            background: "var(--ui-muted)",
            padding: 4,
            borderRadius: 999,
            overflowX: "auto",
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: isActive ? "var(--ui-surface)" : "transparent",
                  color: isActive ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: isActive ? "0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAccountsModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--ui-text-2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <HublyLinkIcon size={18} />
          <span>Cuentas</span>
        </button>
      </div>

      {/* TAB 1: CALENDARIO */}
    </>
  );
}
