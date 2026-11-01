"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./hubly-saas.css";
import "./app-base.css";
import "./dashboard-polish.css";
import { useHublyStore } from "@/lib/store";
import { useHubiChats } from "@/lib/hubi-chats";
import { useLayer } from "@/lib/use-layer";
import { HubiChatList } from "@/components/app/HubiChatList";
import { backendEnabled } from "@/lib/supabase/config";
import type { HublyAgent } from "@/lib/types";
import { HublyCatAvatar, HublyRoughFilterDefs, BentoIcon, ChatBubbleIcon, NotebookIcon, CalendarFilledIcon, BrainFilledIcon, FolderFilledIcon, LayersFilledIcon, HashBoldIcon, BullseyeFilledIcon } from "@/components/app/icons/HublyIcons";
import { AppSurfaces } from "@/components/app/shell/AppSurfaces";
import { BrandSwitcher } from "@/components/app/shell/BrandSwitcher";
import { SidebarFooter } from "@/components/app/shell/SidebarFooter";
import { SidebarTop, type SidebarTab } from "@/components/app/shell/SidebarTop";
import { MobileTabbar } from "@/components/app/shell/MobileTabbar";
import { MobileTopbar } from "@/components/app/shell/MobileTopbar";
import {
  HublyBoltIcon,
  HublyChevronLeftIcon as ChevronLeft,
  HublyPeopleIcon,
  HublyPlusIcon as Plus,
  HublyTagIcon,
} from "@/components/app/icons/DuotoneIcons";



const NO_AGENTS: HublyAgent[] = [];


export default function SaaSAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();

  // Store selectors (100% reactive, zero hardcoded user or brand literals)
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  // Con cuentas reales nada se monta sobre los datos de ejemplo iniciales.
  const appHydrated = useHublyStore((s) => s.hydrated);
  const isReferenceFixture = useHublyStore((s) => s.isReferenceFixture);


  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const tasks = useHublyStore((s) => s.tasks);


  const aiDrawerOpen = useHublyStore((s) => s.aiDrawerOpen);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const agents = useHublyStore((s) => s.agents) ?? NO_AGENTS;
  const addAgent = useHublyStore((s) => s.addAgent);

  // Shell layout & popover states
  const [collapsed, setCollapsed] = useState(false);
  const [userToggledCollapse, setUserToggledCollapse] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(
    pathname.startsWith("/agentes") ? "hubi" : "inicio"
  );
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);


  const brandDropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profilePopoverRef = useRef<HTMLDivElement | null>(null);

  // Hydrate workspace from storage/server on mount WITHOUT forcing "brand-min"
  // (`syncFromServer` automatically inspects `?workspace=` and `?fixture=reference`).
  useEffect(() => {
    void syncFromServer();
    // Enlaces guardados con ?workspace=: ya se leyó, así que sale de la barra de direcciones.
    const url = new URL(window.location.href);
    if (url.searchParams.has("workspace")) {
      url.searchParams.delete("workspace");
      window.history.replaceState(null, "", url);
    }
  }, [syncFromServer]);


  // Responsive sidebar adaptation (768x1024 auto-collapses to 68px rail unless user manually toggled;
  // <768px uses mobile topbar + slide-over drawer)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 768) {
        setMobileDrawerOpen(false);
      }
      if (!userToggledCollapse) {
        if (w >= 768 && w < 1024) {
          setCollapsed(true);
        } else if (w >= 1024) {
          setCollapsed(false);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [userToggledCollapse]);

  // Close mobile drawer and transient menus on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setBrandMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  // Los menús del sidebar son capas: Escape los cierra a ellos antes que al editor.
  useLayer(brandMenuOpen, () => setBrandMenuOpen(false));
  useLayer(notificationsOpen, () => setNotificationsOpen(false));
  useLayer(profileMenuOpen, () => setProfileMenuOpen(false));
  useLayer(mobileDrawerOpen, () => setMobileDrawerOpen(false));

  // Global Escape key and outside-click dismissal for shell popovers & mobile drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileDrawerOpen) setMobileDrawerOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        brandMenuOpen &&
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(target)
      ) {
        setBrandMenuOpen(false);
      }
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        profileMenuOpen &&
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [mobileDrawerOpen, brandMenuOpen, notificationsOpen, profileMenuOpen]);

  // Active brand derived strictly from store state (persisted in localStorage)
  const activeBrand = useMemo(
    () =>
      brands.find((b) => b.id === activeBrandId) ||
      brands.find((b) => b.status !== "archived") ||
      brands[0],
    [brands, activeBrandId]
  );

  // Dynamic counters from store
  const pendingTasksCount = useMemo(() => {
    const brandPending = tasks.filter(
      (t) =>
        (!activeBrandId || t.brandId === activeBrandId) &&
        t.status !== "Completada"
    ).length;
    if (brandPending > 0) return brandPending;
    return tasks.filter((t) => t.status !== "Completada").length;
  }, [tasks, activeBrandId]);



  // Preserve ?fixture= on internal navigation links. La agencia activa no va en la
  // URL: vive en el navegador, y así las rutas quedan limpias.
  const preservedQuerySuffix = isReferenceFixture ? "?fixture=reference" : "";

  const withQuery = (baseHref: string) => {
    if (!preservedQuerySuffix) return baseHref;
    if (baseHref.includes("?")) {
      return `${baseHref}&${preservedQuerySuffix.slice(1)}`;
    }
    return `${baseHref}${preservedQuerySuffix}`;
  };

  const handleCreateAgent = () => {
    const agent = addAgent();
    if (!agent) return;
    setMobileDrawerOpen(false);
    router.push(withQuery(`/agentes/${agent.id}`));
  };

  const agencyNav = useMemo(
    () => [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: BentoIcon,
        badge: undefined as number | undefined,
      },
      {
        href: "/chat",
        label: "Chat",
        icon: ChatBubbleIcon,
        badge: undefined as number | undefined,
      },
      {
        href: "/tareas",
        label: "Mi espacio",
        icon: NotebookIcon,
        badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      },
      {
        href: "/calendario",
        label: "Calendario",
        icon: CalendarFilledIcon,
        badge: undefined as number | undefined,
      },
      {
        href: "/crm",
        label: "CRM",
        icon: HublyPeopleIcon,
        badge: undefined as number | undefined,
      },
      {
        href: "/marcas",
        label: "Marcas",
        icon: HublyTagIcon,
        badge: undefined as number | undefined,
      },
      {
        href: "/automatizaciones",
        label: "Automatizaciones",
        icon: HublyBoltIcon,
        badge: undefined as number | undefined,
      },
    ],
    [pendingTasksCount]
  );

  const brandNav = useMemo(
    () => [
      { href: "/marca", label: "Núcleo de marca", icon: BrainFilledIcon },
      {
        href: "/archivos",
        label: "Content Manager",
        icon: FolderFilledIcon,
        exactPath: true,
      },
      {
        href: "/proyectos",
        label: "Proyectos",
        icon: LayersFilledIcon,
      },
      { href: "/parrillas", label: "Social Media", icon: HashBoldIcon },
      { href: "/anuncios", label: "Ads", icon: BullseyeFilledIcon },
    ],
    []
  );

  const isNavActive = (href: string, exactPath?: boolean) => {
    const cleanHref = href.split("?")[0];
    if (exactPath) {
      return pathname === cleanHref;
    }
    if (cleanHref === "/marca") {
      return (
        pathname === "/marca" ||
        pathname.startsWith("/marca/") ||
        pathname === "/estrategia" ||
        pathname === "/buyer-personas"
      );
    }
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };


  // El editor retrae el sidebar al abrirse; después manda lo que la persona elija.
  const [composerSidebarOpen, setComposerSidebarOpen] = useState(false);
  useEffect(() => {
    // Cada apertura del editor vuelve a la retracción automática.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!composerOpen) setComposerSidebarOpen(false);
  }, [composerOpen]);

  const handleToggleCollapse = () => {
    if (composerOpen) {
      setComposerSidebarOpen((prev) => !prev);
      return;
    }
    setUserToggledCollapse(true);
    setCollapsed((prev) => !prev);
  };

  const hubiFullView = useHubiChats((s) => s.fullView);
  const targetCollapsed = ((composerOpen ? !composerSidebarOpen : collapsed) || (aiDrawerOpen && !hubiFullView)) && !mobileDrawerOpen;
  const [isEffectiveCollapsed, setRenderedCollapsed] = useState(targetCollapsed);
  const [sidebarMotion, setSidebarMotion] = useState<"" | "collapsing" | "expanding">("");
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarTops = useRef<Map<Element, number> | null>(null);

  useEffect(() => {
    if (targetCollapsed === isEffectiveCollapsed) return;
    const sidebar = sidebarRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!sidebar || reduced || mobileDrawerOpen) {
      setRenderedCollapsed(targetCollapsed);
      return;
    }
    const swap = () => {
      sidebarTops.current = new Map(
        Array.from(sidebar.children).map((el) => [el, el.getBoundingClientRect().top])
      );
      setRenderedCollapsed(targetCollapsed);
    };
    setSidebarMotion(targetCollapsed ? "collapsing" : "expanding");
    const swapTimer = targetCollapsed ? window.setTimeout(swap, 100) : null;
    if (!targetCollapsed) swap();
    const endTimer = window.setTimeout(() => setSidebarMotion(""), 360);
    return () => {
      if (swapTimer !== null) window.clearTimeout(swapTimer);
      window.clearTimeout(endTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCollapsed]);

  // Los bloques que cambian de altura se reacomodan en Y sin saltos.
  useLayoutEffect(() => {
    const tops = sidebarTops.current;
    const sidebar = sidebarRef.current;
    if (!tops || !sidebar) return;
    sidebarTops.current = null;
    Array.from(sidebar.children).forEach((el) => {
      if (el.classList.contains("hubly-sidebar-collapse-btn")) return;
      const before = tops.get(el);
      const delta = before === undefined ? 0 : before - el.getBoundingClientRect().top;
      const fades = !el.matches("nav");
      el.animate(
        [
          { transform: `translateY(${delta}px)`, opacity: fades ? 0 : 1 },
          { opacity: fades ? 0 : 1, offset: 0.55 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 220, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
    });
  }, [isEffectiveCollapsed]);
  const activeSidebarTab = isEffectiveCollapsed ? "inicio" : sidebarTab;

  return (
    <div className="hubly-app-root hb-app-root">
      <HublyRoughFilterDefs />

      {/* =====================================================================
          MOBILE TOP BAR (< 768px): Hamburger + Hubly Logo + Compact Brand + Actions
         ===================================================================== */}
      <MobileTopbar
        drawerOpen={mobileDrawerOpen}
        onToggleDrawer={() => setMobileDrawerOpen((prev) => !prev)}
        activeBrand={activeBrand}
        withQuery={withQuery}
      />

      {/* Mobile Drawer Backdrop (< 768px) */}
      {mobileDrawerOpen && (
        <div
          role="presentation"
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 58,
          }}
        />
      )}

      {/* =====================================================================
          FLOATING LEFT SIDEBAR (256px expanded / 68px collapsed / Mobile Drawer)
         ===================================================================== */}
      <aside
        ref={sidebarRef}
        id="hubly-sidebar-nav"
        aria-label="Navegación principal de Hubly"
        className={`hubly-sidebar hb-sidebar ${
          targetCollapsed ? "is-collapsed" : ""
        } ${sidebarMotion ? `is-animating is-${sidebarMotion}` : ""} ${mobileDrawerOpen ? "is-mobile-drawer-open" : ""} ${profileMenuOpen ? "has-profile-popover" : ""}`.trim()}
        data-sidebar-tab={activeSidebarTab}
        onClickCapture={(e) => {
          if (hubiFullView && (e.target as HTMLElement).closest("a[href]")) setAiDrawerOpen(false);
        }}
        style={{
          transition:
            "width 200ms cubic-bezier(0.4, 0, 0.2, 1), min-width 200ms cubic-bezier(0.4, 0, 0.2, 1), padding 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          ...(mobileDrawerOpen
            ? {
                position: "fixed",
                top: 8,
                left: 8,
                bottom: 8,
                width: 268,
                minWidth: 268,
                maxWidth: "calc(100vw - 24px)",
                height: "calc(100dvh - 16px)",
                zIndex: 59,
                display: "flex",
              }
            : {}),
        }}
      >
        {/* Circular Collapse / Expand Button on Right Edge at top: 50% */}
        {!mobileDrawerOpen && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="hubly-sidebar-collapse-btn hb-sidebar-collapse-btn"
            aria-label={
              targetCollapsed
                ? "Expandir barra lateral"
                : "Colapsar barra lateral"
            }
            title={
              targetCollapsed
                ? "Expandir barra lateral"
                : "Colapsar barra lateral"
            }
          >
            <ChevronLeft size={13} className="hubly-collapse-chevron" />
          </button>
        )}

        <SidebarTop
          isEffectiveCollapsed={isEffectiveCollapsed}
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
          activeSidebarTab={activeSidebarTab}
          setSidebarTab={setSidebarTab}
          setBrandMenuOpen={setBrandMenuOpen}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          notificationsRef={notificationsRef}
          activeBrand={activeBrand}
          withQuery={withQuery}
        />
        {/* Section AGENCIA */}
        {!isEffectiveCollapsed && (
          <div className="hubly-section-label hb-section-label">AGENCIA</div>
        )}
        <nav
          aria-label="Módulos de agencia"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            alignItems: isEffectiveCollapsed ? "center" : "stretch",
          }}
        >
          {agencyNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={withQuery(item.href)}
                title={isEffectiveCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`hubly-nav-item hb-nav-item ${
                  active ? "active" : ""
                }`.trim()}
                style={{
                  justifyContent: isEffectiveCollapsed
                    ? "center"
                    : "space-between",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <Icon active={active} />
                  {!isEffectiveCollapsed && <span>{item.label}</span>}
                </span>

                {!isEffectiveCollapsed &&
                  typeof item.badge === "number" &&
                  item.badge > 0 && (
                    <span
                      data-testid="sidebar-tasks-badge"
                      aria-label={`${item.badge} tareas pendientes`}
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: "0 6px",
                        borderRadius: 9999,
                        background: active ? "var(--ui-sky-border)" : "var(--ui-muted)",
                        color: active ? "var(--ui-accent-text)" : "var(--ui-text-3)",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                {isEffectiveCollapsed &&
                  typeof item.badge === "number" &&
                  item.badge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        width: 6,
                        height: 6,
                        borderRadius: 9999,
                        background: "var(--hb-accent)",
                      }}
                    />
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Horizontal Divider */}
        <div
          style={{
            height: 1,
            width: isEffectiveCollapsed ? 28 : "calc(100% - 8px)",
            background: "var(--ui-muted)",
            margin: isEffectiveCollapsed ? "12px auto" : "14px 4px 12px",
            flexShrink: 0,
          }}
        />

        {!isEffectiveCollapsed && activeBrand && (
          <BrandSwitcher
            activeBrand={activeBrand}
            brandMenuOpen={brandMenuOpen}
            setBrandMenuOpen={setBrandMenuOpen}
            brandDropdownRef={brandDropdownRef}
          />
        )}

        {/* Brand Nav Items */}
        <nav
          aria-label="Módulos de marca"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            alignItems: isEffectiveCollapsed ? "center" : "stretch",
          }}
        >
          {brandNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, item.exactPath);
            return (
              <Link
                key={item.href}
                href={withQuery(item.href)}
                title={isEffectiveCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`hubly-nav-item hb-nav-item ${
                  active ? "active" : ""
                }`.trim()}
              >
                <Icon active={active} />
                {!isEffectiveCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {activeSidebarTab !== "inicio" && (
          <div className="hubly-sidebar-keep hubly-sidebar-panel">
            {activeSidebarTab === "hubi" ? (
              <>
                <div className="hubly-sidebar-panel-head">
                  <span>Agentes</span>
                  <button type="button" aria-label="Crear agente" title="Crear agente" onClick={handleCreateAgent}>
                    <Plus size={14} />
                  </button>
                </div>
                {agents.length > 0 ? (
                  <nav className="hubly-sidebar-agents" aria-label="Agentes">
                    {agents.map((agent) => {
                      const href = `/agentes/${agent.id}`;
                      return (
                        <Link
                          key={agent.id}
                          href={withQuery(href)}
                          title={agent.name}
                          aria-current={pathname === href ? "page" : undefined}
                          className="hubly-sidebar-agent"
                          onClick={() => setMobileDrawerOpen(false)}
                        >
                          <HublyCatAvatar size={22} />
                          <span>{agent.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                ) : (
                  <button type="button" className="hubly-sidebar-empty" onClick={handleCreateAgent}>
                    <strong>Sin agentes</strong>
                    <small>Crea tu primer agente</small>
                  </button>
                )}
              </>
            ) : (
              <HubiChatList onOpen={() => setMobileDrawerOpen(false)} />
            )}
          </div>
        )}

        <SidebarFooter
          isEffectiveCollapsed={isEffectiveCollapsed}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          profilePopoverRef={profilePopoverRef}
          withQuery={withQuery}
        />
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE CANVAS
         ===================================================================== */}
      <div className="hubly-main hb-main">
        <main className="hubly-page hb-page">
          <React.Suspense fallback={null}>{!backendEnabled || appHydrated ? children : null}</React.Suspense>
        </main>
      </div>

      {/* =====================================================================
          MOBILE BOTTOM TABBAR (< 768px): Mi espacio, Social, Hubi, Ads, Más
         ===================================================================== */}
      <MobileTabbar onOpenDrawer={() => setMobileDrawerOpen(true)} withQuery={withQuery} isNavActive={isNavActive} />

      {/* =====================================================================
          SHARED SURFACES, DRAWERS & MODALS
         ===================================================================== */}
      <AppSurfaces />
    </div>
  );
}
