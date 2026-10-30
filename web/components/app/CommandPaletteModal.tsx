"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  Calendar,
  CheckSquare,
  CornerDownLeft,
  FileText,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import { openNotebookModal } from "@/components/app/NotebookReaderModal";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";

export interface CommandPaletteModalProps {
  open?: boolean;
  onClose?: () => void;
}

interface CommandItem {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon: React.ReactNode;
  action: () => void;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function CommandPaletteModal({
  open: openProp,
  onClose: onCloseProp,
}: CommandPaletteModalProps = {}) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const cmdkOpen = useHublyStore((s) => s.cmdkOpen);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const notebooks = useHublyStore((s) => s.notebooks);
  const teamMembers = useHublyStore((s) => s.team);
  const openComposer = useHublyStore((s) => s.openComposer);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const setWidgetConfigModalOpen = useHublyStore(
    (s) => s.setWidgetConfigModalOpen
  );
  const setAutoSuggestionsModalOpen = useHublyStore(
    (s) => s.setAutoSuggestionsModalOpen
  );
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);

  const isOpen = openProp !== undefined ? openProp : cmdkOpen;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleClose = () => {
    setQuery("");
    if (onCloseProp) {
      onCloseProp();
    } else {
      setCmdkOpen(false);
    }
  };

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen(!useHublyStore.getState().cmdkOpen);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [setCmdkOpen]);

  // Reset search query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allItems = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();

    const quickActions: CommandItem[] = [
      {
        id: "act-composer",
        group: "Acciones rápidas",
        label: "Crear o programar publicación",
        sublabel: "Abre el compositor de posts, Reels y Stories",
        badge: "Acción",
        icon: <Plus size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => openComposer(null));
        },
      },
      {
        id: "act-new-brand",
        group: "Acciones rápidas",
        label: "Crear nueva marca / cuenta de cliente",
        sublabel: "Configura identidad y compromisos mensuales",
        badge: "Acción",
        icon: <Building2 size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setNewBrandModalOpen(true));
        },
      },
      {
        id: "act-invite-team",
        group: "Acciones rápidas",
        label: "Invitar miembro al equipo",
        sublabel: "Genera invitación local con rol y marcas asignadas",
        badge: "Equipo",
        icon: <UserPlus size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setInviteModalOpen(true));
        },
      },
      {
        id: "act-suggestions",
        group: "Acciones rápidas",
        label: "Revisar sugerencias automáticas de metas",
        sublabel: "Motor de reglas sobre el cumplimiento del último mes",
        badge: "Salud",
        icon: <Sparkles size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setAutoSuggestionsModalOpen(true));
        },
      },
      {
        id: "act-widgets",
        group: "Acciones rápidas",
        label: "Configurar widgets del Dashboard",
        sublabel: "Mostrar, ocultar, cambiar columna o reordenar widgets",
        badge: "Dashboard",
        icon: <LayoutGrid size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setWidgetConfigModalOpen(true));
        },
      },
      {
        id: "act-hubly-ai",
        group: "Acciones rápidas",
        label: "Pregúntale a Hubi",
        sublabel: "Consulta tareas vencidas, salud de cuentas y aprobaciones",
        badge: "Hubi",
        icon: <HublyCatAvatar size={16} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setAiDrawerOpen(true));
        },
      },
    ];

    const navigationItems: CommandItem[] = [
      {
        id: "nav-dashboard",
        group: "Navegación",
        label: "Dashboard · Inicio",
        sublabel: "Resumen operativo, tareas, libretas y aprobaciones",
        icon: <LayoutGrid size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          router.push("/dashboard");
        },
      },
      {
        id: "nav-cuentas",
        group: "Navegación",
        label: "Dashboard · Salud de Cuentas",
        sublabel: "Cumplimiento de entregas, presupuesto y estado de pauta",
        icon: <Sparkles size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          router.push("/dashboard?tab=cuentas");
        },
      },
      {
        id: "nav-equipo",
        group: "Navegación",
        label: "Dashboard · Equipo",
        sublabel: "Carga operativa, actividad semanal e invitaciones",
        icon: <Users size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          router.push("/dashboard?tab=equipo");
        },
      },
      {
        id: "nav-tareas",
        group: "Navegación",
        label: "Mi Espacio (Tareas y Libretas Kraft)",
        sublabel: "Gestión de entregables y notas de estrategia",
        icon: <CheckSquare size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          router.push("/tareas");
        },
      },
      {
        id: "nav-calendario",
        group: "Navegación",
        label: "Calendario Editorial",
        sublabel: "Planeación mensual de publicaciones",
        icon: <Calendar size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          router.push("/calendario");
        },
      },
      {
        id: "nav-parrillas",
        group: "Navegación",
        label: "Social Media / Parrillas",
        sublabel: "Parrilla de contenidos y flujo de aprobación",
        icon: <FileText size={14} style={{ color: "#64748B" }} />,
        action: () => {
          handleClose();
          router.push("/parrillas");
        },
      },
      {
        id: "nav-marca",
        group: "Navegación",
        label: "Núcleo de Marca",
        sublabel: "Tono de voz, arquetipos y pilares editoriales",
        icon: <BookOpen size={14} style={{ color: "#64748B" }} />,
        action: () => {
          handleClose();
          router.push("/marca");
        },
      },
      {
        id: "nav-anuncios",
        group: "Navegación",
        label: "Ads / Campañas Activas",
        sublabel: "Rendimiento de pauta, clics y ROAS",
        icon: <Megaphone size={14} style={{ color: "#E11D48" }} />,
        action: () => {
          handleClose();
          router.push("/anuncios");
        },
      },
      {
        id: "nav-chat",
        group: "Navegación",
        label: "Chat de Agencia",
        sublabel: "Conversaciones por canal de marca",
        icon: <MessageSquare size={14} style={{ color: "#64748B" }} />,
        action: () => {
          handleClose();
          router.push("/chat");
        },
      },
      {
        id: "nav-ajustes",
        group: "Navegación",
        label: "Ajustes del Workspace",
        sublabel: "Configuración de cuenta y preferencias",
        icon: <Settings size={14} style={{ color: "#64748B" }} />,
        action: () => {
          handleClose();
          router.push("/ajustes");
        },
      },
    ];

    const brandItems: CommandItem[] = brands.map((b) => ({
      id: `brand-${b.id}`,
      group: "Marcas",
      label: `${b.name} (${b.handle})`,
      sublabel: `${b.industry} · Salud ${b.healthScore}%`,
      badge: b.id === activeBrandId ? "Activa" : "Cambiar marca",
      icon: (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: b.color,
            color: "#FFFFFF",
            fontSize: 9,
            fontWeight: 700,
            display: "inline-grid",
            placeItems: "center",
          }}
        >
          {b.initials}
        </span>
      ),
      action: () => {
        setActiveBrand(b.id);
        handleClose();
      },
    }));

    const taskItems: CommandItem[] = tasks.map((t) => {
      const b = brands.find((br) => br.id === t.brandId);
      return {
        id: `task-${t.id}`,
        group: "Tareas",
        label: t.title,
        sublabel: `${b?.name || "Agencia"} · ${t.assignee} · Vence ${t.dueDate}`,
        badge: t.completed ? "Completada" : String(t.priority),
        icon: <CheckSquare size={14} style={{ color: "#64748B" }} />,
        action: () => {
          setActiveBrand(t.brandId);
          handleClose();
          router.push("/tareas");
        },
      };
    });

    const postItems: CommandItem[] = posts.map((p) => {
      const b = brands.find((br) => br.id === p.brandId);
      return {
        id: `post-${p.id}`,
        group: "Publicaciones",
        label: p.title,
        sublabel: `${b?.name || "Marca"} · ${p.network || p.networks?.[0] || "Instagram"} (${p.format}) · ${p.scheduledDate}`,
        badge: p.statusLabel || p.status,
        icon: <FileText size={14} style={{ color: "#6C77C1" }} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => openComposer(p.id));
        },
      };
    });

    const notebookItems: CommandItem[] = notebooks.map((nb) => ({
      id: `nb-${nb.id}`,
      group: "Libretas Kraft",
      label: nb.title,
      sublabel: nb.subtitle,
      badge: nb.category || nb.stamp || "Libreta",
      icon: <BookOpen size={14} style={{ color: "#8C6239" }} />,
      action: () => {
        handleClose();
        window.requestAnimationFrame(() => openNotebookModal(nb.id));
      },
    }));

    const memberItems: CommandItem[] = teamMembers.map((m) => ({
      id: `member-${m.id}`,
      group: "Equipo",
      label: m.name,
      sublabel: `${m.role} · ${m.email}`,
      badge: m.status,
      icon: <Users size={14} style={{ color: "#6C77C1" }} />,
      action: () => {
        handleClose();
        router.push("/dashboard?tab=equipo");
      },
    }));

    const combined = [
      ...quickActions,
      ...navigationItems,
      ...brandItems,
      ...notebookItems,
      ...taskItems,
      ...postItems,
      ...memberItems,
    ];

    if (!q) {
      return [
        ...quickActions,
        ...navigationItems.slice(0, 6),
        ...brandItems,
        ...notebookItems,
        ...taskItems.slice(0, 4),
      ];
    }

    return combined.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query,
    brands,
    activeBrandId,
    tasks,
    posts,
    notebooks,
    teamMembers,
    router,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus trap, Escape key, Arrow navigation & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length > 0 ? (prev + 1) % allItems.length : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length > 0
            ? (prev - 1 + allItems.length) % allItems.length
            : 0
        );
        return;
      }

      if (e.key === "Enter" && allItems[selectedIndex]) {
        e.preventDefault();
        allItems[selectedIndex].action();
        return;
      }

      if (e.key === "Tab") {
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
      const remainingDialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (remainingDialogs.length <= 1) {
        document.body.style.overflow = prevOverflow || "";
      }
      const prevEl = previousActiveElementRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        window.requestAnimationFrame(() => {
          prevEl.focus();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allItems, selectedIndex]);

  const presence = useModalPresence(isOpen);
  if (!presence.mounted) return null;

  const groupedSections: Array<{
    group: string;
    entries: Array<{ item: CommandItem; flatIdx: number }>;
  }> = [];

  allItems.forEach((item, flatIdx) => {
    let section = groupedSections.find((s) => s.group === item.group);
    if (!section) {
      section = { group: item.group, entries: [] };
      groupedSections.push(section);
    }
    section.entries.push({ item, flatIdx });
  });

  return (
    <div
      className="hubly-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "11vh 16px 24px",
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#0F172A",
        }}
      >
        <h2
          id={titleId}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          Buscador rápido y paleta de comandos de Hubly
        </h2>

        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 16px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Search size={16} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas, marcas, posts, libretas o comandos..."
            aria-label="Buscar tareas, marcas, posts, libretas o comandos"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13.5,
              color: "#0F172A",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar paleta de comandos (Escape)"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94A3B8",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 5,
              padding: "2px 6px",
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: 370,
            overflowY: "auto",
            padding: "8px 8px 10px",
          }}
        >
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.group} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "4px 10px 4px",
                  }}
                >
                  {section.group}
                </div>

                {section.entries.map(({ item, flatIdx }) => {
                  const active = flatIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                      onClick={item.action}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: active ? "#F1F5F9" : "transparent",
                        color: "#0F172A",
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 7,
                            background: active ? "#FFFFFF" : "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "inline-grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              display: "block",
                              color: "#0F172A",
                              lineHeight: 1.25,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </span>
                          {item.sublabel && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 11,
                                color: "#64748B",
                                fontWeight: 400,
                                marginTop: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.sublabel}
                            </span>
                          )}
                        </span>
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {item.badge && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 9999,
                              background: "#F0F1F9",
                              color: "#6C77C1",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <CornerDownLeft
                            size={13}
                            style={{ color: "#64748B" }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "28px 16px",
                textAlign: "center",
                fontSize: 13,
                color: "#64748B",
              }}
            >
              No se encontraron resultados para{" "}
              <strong style={{ color: "#0F172A" }}>&ldquo;{query}&rdquo;</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderTop: "1px solid #F1F5F9",
            background: "#FAFAFA",
            fontSize: 11,
            color: "#94A3B8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span>
              <strong style={{ color: "#64748B" }}>↑↓</strong> navegar
            </span>
            <span>
              <strong style={{ color: "#64748B" }}>↵</strong> abrir
            </span>
            <span>
              <strong style={{ color: "#64748B" }}>esc</strong> cerrar
            </span>
          </div>
          <span>Hubly Command · ⌘K</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPaletteModal;
