"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./hubly-saas.css";
import "./app-base.css";
import "./dashboard-polish.css";
import { useModalPresence } from "@/lib/use-modal-presence";
import { useHublyTheme } from "@/lib/theme";
import { useHublyStore } from "@/lib/store";
import { useLayer } from "@/lib/use-layer";
import { PostComposerModal } from "@/components/app/PostComposerModal";
import { NewBrandModal } from "@/components/app/NewBrandModal";
import { CommandPaletteModal } from "@/components/app/CommandPaletteModal";
import { InviteTeamModal } from "@/components/app/InviteTeamModal";
import { NotebookReaderModal } from "@/components/app/NotebookReaderModal";
import { WidgetConfigModal } from "@/components/app/WidgetConfigModal";
import { AutoSuggestionsModal } from "@/components/app/AutoSuggestionsModal";
import { FloatingAIDrawer } from "@/components/app/FloatingAIDrawer";
import { AppDialogHost } from "@/components/app/AppDialogHost";
import { SaveStatus } from "@/components/app/SaveStatus";
import { backendEnabled } from "@/lib/supabase/config";
import { DescubreHublyWidget } from "@/components/app/DescubreHublyWidget";
import { HublyCatAvatar, HublyRoughFilterDefs, BentoIcon, ChatBubbleIcon, HublyHomeIcon, NotebookIcon, CalendarFilledIcon, BrainFilledIcon, FolderFilledIcon, LayersFilledIcon, HashBoldIcon, BullseyeFilledIcon } from "@/components/app/icons/HublyIcons";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import {
  HublyBellIcon as Bell,
  HublyBoltIcon,
  HublyBuildingIcon as Building2,
  HublyCheckIcon as Check,
  HublyChevronDownIcon as ChevronDown,
  HublyChevronLeftIcon as ChevronLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyCloseIcon as X,
  HublyGlobeIcon as Globe,
  HublyHeadsetIcon,
  HublyMenuIcon as Menu,
  HublyMoonIcon as Moon,
  HublyPeopleIcon,
  HublyPersonIcon as User,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
  HublySettingsIcon as Settings,
  HublySparkIcon as Sparkles,
  HublySunIcon as Sun,
  HublyTagIcon,
  HublyBuildingIcon,
} from "@/components/app/icons/DuotoneIcons";

// Flexible wrappers so shared modals work seamlessly whether they read state from
// useHublyStore internally or accept explicit open/onClose props.
const InviteTeamModalSurface =
  InviteTeamModal as unknown as React.ComponentType<Record<string, unknown>>;
const NotebookReaderModalSurface =
  NotebookReaderModal as unknown as React.ComponentType<Record<string, unknown>>;
const WidgetConfigModalSurface =
  WidgetConfigModal as unknown as React.ComponentType<Record<string, unknown>>;
const AutoSuggestionsModalSurface =
  AutoSuggestionsModal as unknown as React.ComponentType<Record<string, unknown>>;

const DescubreHublyWidgetSurface =
  DescubreHublyWidget as unknown as React.ComponentType<Record<string, unknown>>;

const TIMEZONE_OPTIONS = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Lima (GMT-5)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "UTC", label: "UTC" },
];

const DEMO_WORKSPACES = [
  { id: "default", label: "Mi Agencia (Principal)", badge: "Principal" },
  { id: "workspace-b", label: "Agencia Norte (Workspace B)", badge: "Demo B" },
];

export default function SaaSAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/dashboard";

  // Store selectors (100% reactive, zero hardcoded user or brand literals)
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  // Con cuentas reales nada se monta sobre los datos de ejemplo iniciales.
  const appHydrated = useHublyStore((s) => s.hydrated);
  const workspaceId = useHublyStore((s) => s.workspaceId);
  const isReferenceFixture = useHublyStore((s) => s.isReferenceFixture);
  const switchWorkspace = useHublyStore((s) => s.switchWorkspace);

  const profile = useHublyStore((s) => s.profile);
  const updateProfile = useHublyStore((s) => s.updateProfile);

  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);

  const tasks = useHublyStore((s) => s.tasks);
  const notifications = useHublyStore((s) => s.notifications);
  const markNotificationRead = useHublyStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useHublyStore(
    (s) => s.markAllNotificationsRead
  );

  const notebooks = useHublyStore((s) => s.notebooks);
  const activeNotebookId = useHublyStore((s) => s.activeNotebookId);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);

  const openComposer = useHublyStore((s) => s.openComposer);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const aiDrawerOpen = useHublyStore((s) => s.aiDrawerOpen);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const widgetConfigModalOpen = useHublyStore((s) => s.widgetConfigModalOpen);
  const setWidgetConfigModalOpen = useHublyStore(
    (s) => s.setWidgetConfigModalOpen
  );
  const autoSuggestionsModalOpen = useHublyStore(
    (s) => s.autoSuggestionsModalOpen
  );
  const setAutoSuggestionsModalOpen = useHublyStore(
    (s) => s.setAutoSuggestionsModalOpen
  );

  // Shell layout & popover states
  const [collapsed, setCollapsed] = useState(false);
  const [userToggledCollapse, setUserToggledCollapse] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"inicio" | "hubi" | "chats">("inicio");
  const { theme, toggleTheme } = useHublyTheme();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const brandMenuPresence = useModalPresence(brandMenuOpen, 100);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Editable profile draft inside the quick profile popover
  const [draftName, setDraftName] = useState(profile.name);
  const [draftRole, setDraftRole] = useState(profile.role);
  const [draftTimezone, setDraftTimezone] = useState(profile.timezone);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const brandDropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profilePopoverRef = useRef<HTMLDivElement | null>(null);

  // Hydrate workspace from storage/server on mount WITHOUT forcing "brand-min"
  // (`syncFromServer` automatically inspects `?workspace=` and `?fixture=reference`).
  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  // Keep profile draft fields in sync when store profile changes
  useEffect(() => {
    setDraftName(profile.name);
    setDraftRole(profile.role);
    setDraftTimezone(profile.timezone);
  }, [profile.name, profile.role, profile.timezone]);

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

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const activeNotebook = useMemo(
    () => notebooks.find((n) => n.id === activeNotebookId) || null,
    [notebooks, activeNotebookId]
  );

  // Preserve ?workspace= and ?fixture= query params on internal navigation links
  const preservedQuerySuffix = useMemo(() => {
    const params = new URLSearchParams();
    if (workspaceId && workspaceId !== "default") {
      params.set("workspace", workspaceId);
    }
    if (isReferenceFixture) {
      params.set("fixture", "reference");
    }
    const str = params.toString();
    return str ? `?${str}` : "";
  }, [workspaceId, isReferenceFixture]);

  const withQuery = (baseHref: string) => {
    if (!preservedQuerySuffix) return baseHref;
    if (baseHref.includes("?")) {
      return `${baseHref}&${preservedQuerySuffix.slice(1)}`;
    }
    return `${baseHref}${preservedQuerySuffix}`;
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
        label: "Mi Espacio",
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
      { href: "/marca", label: "Núcleo de Marca", icon: BrainFilledIcon },
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

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = draftName.trim() || profile.name;
    const trimmedRole = draftRole.trim() || profile.role;
    const computedInitials = trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    updateProfile({
      name: trimmedName,
      role: trimmedRole,
      timezone: draftTimezone,
      avatarInitial: computedInitials || profile.avatarInitial || "HU",
    });
    setProfileSavedToast(true);
    window.setTimeout(() => setProfileSavedToast(false), 1800);
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

  const targetCollapsed = ((composerOpen ? !composerSidebarOpen : collapsed) || aiDrawerOpen) && !mobileDrawerOpen;
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
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="hubly-icon-btn hb-icon-btn"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileDrawerOpen}
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
            {mobileDrawerOpen ? <X size={17} /> : <Menu size={17} />}
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

        {/* Top Logo & Quick Icon Bar */}
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
              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Centro de notificaciones"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    width: 280,
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 14,
                    padding: 10,
                    zIndex: 65,
                    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.14)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      padding: "0 4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    >
                      Notificaciones ({unreadNotificationsCount})
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsRead()}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--hb-accent-text)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div
                    className="hubly-scroll"
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "16px 8px",
                          textAlign: "center",
                          fontSize: 12,
                          color: "var(--ui-text-5)",
                        }}
                      >
                        Todo al día en tu agencia
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => markNotificationRead(item.id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid transparent",
                            background: item.read ? "transparent" : "#F1F9FD",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 9999,
                              background: item.read ? "var(--ui-border-strong)" : "var(--hb-accent)",
                              marginTop: 5,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: item.read ? 500 : 600,
                                color: "var(--ui-text-1)",
                                lineHeight: 1.3,
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: 11,
                                color: "var(--ui-text-4)",
                                marginTop: 2,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.body}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Top Header (68px rail, matches 02-dashboard-cuentas-1440.png & 01-dashboard-inicio-768.png) */
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
                        background: active ? "#BFE2F4" : "var(--ui-muted)",
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

        {/* Brand Switcher Row + 4 Quick Square Buttons (Expanded) */}
        {!isEffectiveCollapsed && activeBrand && (
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
                    background:
                      activeBrand.id === "brand-min"
                        ? "#16324F"
                        : activeBrand.color || "#16324F",
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

              {/* Right: Dynamic User Initials Circle + Dashed + Button (Nueva marca) */}
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
                  onClick={() => setNewBrandModalOpen(true)}
                  aria-label="Nueva marca"
                  title="Nueva marca"
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
                          background: isCurrent ? "#F1F9FD" : "transparent",
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
                                b.id === "brand-min"
                                  ? "#16324F"
                                  : b.color || "#16324F",
                              color: "#FFFFFF",
                              fontSize: 9.5,
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
                    setBrandMenuOpen(false);
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
            )}
          </div>
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
                  <button type="button" aria-label="Crear agente con Hubi" onClick={() => setAiDrawerOpen(true)}>
                    <Plus size={14} />
                  </button>
                </div>
                <button type="button" className="hubly-sidebar-empty" onClick={() => setAiDrawerOpen(true)}>
                  <strong>Sin agentes</strong>
                  <small>Crea tu primer agente</small>
                </button>
              </>
            ) : (
              <>
                <div className="hubly-sidebar-panel-head is-chats">
                  <span>Chats</span>
                  <button type="button" aria-label="Nueva conversación" onClick={() => setAiDrawerOpen(true)}>
                    <Plus size={14} />
                  </button>
                </div>
                <button type="button" className="hubly-sidebar-empty is-large" onClick={() => setAiDrawerOpen(true)}>
                  <i><Plus size={16} /></i>
                  <strong>Inicia una conversación</strong>
                  <small>Pregunta, crea copies, pasa links…</small>
                </button>
              </>
            )}
          </div>
        )}

        {/* Bottom Footer of Sidebar */}
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
              aria-label={`Perfil de ${profile.name} (${profile.role}). Clic para editar perfil o espacio de trabajo`}
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
          {profileMenuOpen && (
            <div
              role="dialog"
              aria-label="Editar perfil y espacio de trabajo"
              data-testid="sidebar-profile-popover"
              style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: 0,
                width: 236,
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 16,
                padding: 14,
                zIndex: 70,
                boxShadow: "0 16px 38px rgba(15, 23, 42, 0.16)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <User size={13} style={{ color: "var(--hb-accent-text)" }} />
                  Perfil del operador
                </span>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(false)}
                  className="hubly-icon-btn hb-icon-btn"
                  aria-label="Cerrar menú de perfil"
                  style={{ width: 24, height: 24 }}
                >
                  <X size={13} />
                </button>
              </div>

              <form
                onSubmit={handleSaveProfile}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ui-text-4)",
                      marginBottom: 3,
                    }}
                  >
                    Nombre
                  </span>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="hubly-input saas-input"
                    aria-label="Nombre del operador"
                    style={{ padding: "6px 10px", fontSize: 12.5 }}
                  />
                </label>

                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ui-text-4)",
                      marginBottom: 3,
                    }}
                  >
                    Rol
                  </span>
                  <input
                    type="text"
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value)}
                    className="hubly-input saas-input"
                    aria-label="Rol del operador"
                    style={{ padding: "6px 10px", fontSize: 12.5 }}
                  />
                </label>

                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ui-text-4)",
                      marginBottom: 3,
                    }}
                  >
                    <Globe size={11} />
                    Zona horaria
                  </span>
                  <select
                    value={draftTimezone}
                    onChange={(e) => setDraftTimezone(e.target.value)}
                    className="hubly-select saas-select"
                    aria-label="Zona horaria"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="hbtn hbtn-primary hbtn-sm"
                  style={{
                    width: "100%",
                    marginTop: 2,
                    height: 32,
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {profileSavedToast ? "¡Perfil actualizado!" : "Guardar perfil"}
                </button>
              </form>

              <div
                style={{
                  height: 1,
                  background: "var(--ui-muted)",
                  margin: "12px 0 10px",
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Building2 size={11} />
                  Espacio de trabajo
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {DEMO_WORKSPACES.map((ws) => {
                    const isCurrentWs = workspaceId === ws.id;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          void switchWorkspace(ws.id);
                          setProfileMenuOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: isCurrentWs
                            ? "1px solid #BFE2F4"
                            : "1px solid transparent",
                          background: isCurrentWs ? "#F1F9FD" : "transparent",
                          color: isCurrentWs ? "var(--ui-accent-text)" : "var(--ui-text-2)",
                          fontSize: 12,
                          fontWeight: isCurrentWs ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span>{ws.label}</span>
                        {isCurrentWs && (
                          <Check size={13} style={{ color: "var(--ui-accent-text-2)" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
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
          MOBILE BOTTOM TABBAR (< 768px): Mi Espacio, Social, Hubi, Ads, Más
         ===================================================================== */}
      <nav
        aria-label="Barra de navegación inferior móvil"
        className="hubly-mobile-tabbar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "rgba(255, 255, 255, 0.96)",
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
          <span>Mi Espacio</span>
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
              background: "#F1F9FD",
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
          onClick={() => setMobileDrawerOpen(true)}
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

      {/* =====================================================================
          SHARED SURFACES, DRAWERS & MODALS
         ===================================================================== */}
      <DescubreHublyWidgetSurface />
      <AppDialogHost />
      <SaveStatus />
      <FloatingAIDrawer />
      <PostComposerModal />
      <NewBrandModal />
      <CommandPaletteModal />
      <InviteTeamModalSurface
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
      <NotebookReaderModalSurface
        open={Boolean(activeNotebookId)}
        notebookId={activeNotebookId}
        notebook={activeNotebook}
        onClose={() => setActiveNotebookId(null)}
      />
      <WidgetConfigModalSurface
        open={widgetConfigModalOpen}
        onClose={() => setWidgetConfigModalOpen(false)}
      />
      <AutoSuggestionsModalSurface
        open={autoSuggestionsModalOpen}
        onClose={() => setAutoSuggestionsModalOpen(false)}
      />
    </div>
  );
}
