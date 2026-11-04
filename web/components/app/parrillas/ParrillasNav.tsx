"use client";

import React from "react";
import {
  HublyBentoIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyLinkIcon,
  HublyPresentationIcon,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { SocialSubTab } from "@/lib/domain/posts";

const NAV_ITEMS: { id: SocialSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "calendario", label: "Calendario", icon: <HublyCalendarIcon size={18} /> },
  { id: "ideas", label: "Ideas", icon: <HublySparkIcon size={18} /> },
  { id: "mensajes", label: "Mensajes", icon: <HublyChatIcon size={18} /> },
  { id: "analytics", label: "Analytics", icon: <HublyChartIcon size={18} /> },
  { id: "tableros", label: "Tableros", icon: <HublyBentoIcon size={18} /> },
  { id: "reportes", label: "Reportes", icon: <HublyPresentationIcon size={18} /> },
  { id: "links", label: "Links", icon: <HublyLinkIcon size={18} /> },
];

interface ParrillasNavProps {
  activeTab: SocialSubTab;
  onSelectTab: (tab: SocialSubTab) => void;
  onOpenAccounts: () => void;
}

export function ParrillasNav({ activeTab, onSelectTab, onOpenAccounts }: ParrillasNavProps) {
  return (
    <div className="hubly-parrillas-nav">
      <div className="hubly-parrillas-nav-track">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelectTab(item.id)}
              className={`hubly-parrillas-nav-tab${isActive ? " is-active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenAccounts}
        className="hubly-parrillas-nav-accounts"
      >
        <HublyLinkIcon size={18} />
        <span>Cuentas</span>
      </button>
    </div>
  );
}
