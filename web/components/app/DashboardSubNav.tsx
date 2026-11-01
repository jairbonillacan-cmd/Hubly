"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import {
  BentoNavIcon,
  PulseNavIcon,
  TeamNavIcon,
} from "@/components/app/icons/HublyIcons";

export type DashboardTabKey = "inicio" | "cuentas" | "salud-cuentas" | "equipo";

export interface DashboardSubNavProps {
  /** Optional explicit active tab override; otherwise derived automatically from `usePathname()`. */
  activeTab?: DashboardTabKey;
  /** Optional callback invoked when a tab is clicked (in addition to route navigation). */
  onTabChange?: (tab: "inicio" | "cuentas" | "equipo") => void;
  /** Custom right-side slot overriding default contextual actions when provided. */
  rightSlot?: React.ReactNode;
  /** Alias for `rightSlot`. */
  rightActions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface SubNavTabItem {
  key: "inicio" | "cuentas" | "equipo";
  label: string;
  shortLabel?: string;
  href: string;
  count: number;
  countLabel: string;
  Icon: React.ComponentType<{ active?: boolean; size?: number }>;
}

/**
 * Extracts preserved `?fixture=` and `?clock=` query parameters from the current browser URL
 * or fallback store state so switching between `/dashboard`, `/dashboard/salud-cuentas`, and `/dashboard/equipo`
 * never loses the test fixture context.
 */
function buildPreservedQueryString(
  rawSearch: string,
  storeIsFixture: boolean
): string {
  const out = new URLSearchParams();

  if (rawSearch) {
    const incoming = new URLSearchParams(
      rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch
    );
    const fixture = incoming.get("fixture");
    const clock = incoming.get("clock");
    if (fixture) out.set("fixture", fixture);
    if (clock) out.set("clock", clock);
  } else {
    if (storeIsFixture) {
      out.set("fixture", "reference");
    }
  }

  const serialized = out.toString();
  return serialized ? `?${serialized}` : "";
}

export function DashboardSubNav({
  activeTab,
  onTabChange,
  rightSlot,
  rightActions,
  className = "",
  style,
}: DashboardSubNavProps) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();

  const isReferenceFixture = useHublyStore((s) => s.isReferenceFixture);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const tasks = useHublyStore((s) => s.tasks);
  const teamMembers = useHublyStore((s) => s.teamMembers);

  const [locationSearch, setLocationSearch] = useState<string>("");

  useEffect(() => {
    setLocationSearch(window.location.search);
  }, [pathname, isReferenceFixture]);

  const preservedQuery = useMemo(
    () => buildPreservedQueryString(locationSearch, isReferenceFixture),
    [locationSearch, isReferenceFixture]
  );

  const resolvedActiveKey: "inicio" | "cuentas" | "equipo" = useMemo(() => {
    if (activeTab === "cuentas" || activeTab === "salud-cuentas") return "cuentas";
    if (activeTab === "equipo") return "equipo";
    if (activeTab === "inicio") return "inicio";

    if (pathname.startsWith("/dashboard/salud-cuentas")) return "cuentas";
    if (pathname.startsWith("/dashboard/equipo")) return "equipo";
    return "inicio";
  }, [activeTab, pathname]);

  // Dynamic counters derived from live store data
  const pendingTasksCount = useMemo(() => {
    const brandPending = tasks.filter(
      (t) =>
        (!activeBrandId || t.brandId === activeBrandId) &&
        t.status !== "Completada"
    ).length;
    if (brandPending > 0) return brandPending;
    return tasks.filter((t) => t.status !== "Completada").length;
  }, [tasks, activeBrandId]);

  const activeBrandsCount = useMemo(
    () => brands.filter((b) => b.status !== "archived").length,
    [brands]
  );

  const teamMembersCount = useMemo(() => teamMembers.length, [teamMembers]);

  const tabs: SubNavTabItem[] = useMemo(
    () => [
      {
        key: "inicio",
        label: "Inicio",
        href: `/dashboard${preservedQuery}`,
        count: pendingTasksCount,
        countLabel: `${pendingTasksCount} pendientes`,
        Icon: BentoNavIcon,
      },
      {
        key: "cuentas",
        label: "Salud de Cuentas",
        shortLabel: "Cuentas",
        href: `/dashboard/salud-cuentas${preservedQuery}`,
        count: activeBrandsCount,
        countLabel: `${activeBrandsCount} marcas activas`,
        Icon: PulseNavIcon,
      },
      {
        key: "equipo",
        label: "Equipo",
        href: `/dashboard/equipo${preservedQuery}`,
        count: teamMembersCount,
        countLabel: `${teamMembersCount} integrantes`,
        Icon: TeamNavIcon,
      },
    ],
    [preservedQuery, pendingTasksCount, activeBrandsCount, teamMembersCount]
  );

  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) => {
    let targetIndex: number | null = null;
    if (event.key === "ArrowRight") {
      targetIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      const targetTab = tabs[targetIndex];
      const targetEl = tabRefs.current[targetIndex];
      targetEl?.focus();
      onTabChange?.(targetTab.key);
      router.push(targetTab.href);
    }
  };

  const customRight = rightSlot ?? rightActions;

  return (
    <div
      className={`hubly-dashboard-subnav-wrap ${className}`.trim()}
      style={style}
      data-testid="dashboard-subnav"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        {/* Left: 3-Tab Pill Navigation (height: 36px) */}
        <nav
          aria-label="Subnavegación de Dashboard"
          className="hubly-subnav hubly-tablero-tabs"
        >
          {tabs.map((item, idx) => {
            const isActive = resolvedActiveKey === item.key;
            const Icon = item.Icon;

            return (
              <Link
                key={item.key}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                href={item.href}
                data-tab={item.key}
                aria-current={isActive ? "page" : undefined}
                title={`${item.label} (${item.countLabel})`}
                onClick={() => {
                  onTabChange?.(item.key);
                }}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`hubly-subnav-tab ${isActive ? "is-active" : ""}`.trim()}
              >
                <Icon active={isActive} size={15} />
                <span>{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
        {customRight && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {customRight}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardSubNav;
