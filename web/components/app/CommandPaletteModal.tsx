"use client";

import { Modal } from "@/components/app/ui/Modal";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { useTypedText } from "@/lib/use-typed-text";
import { dueLabelFor, localIsoDate } from "@/lib/date";
import { STATUS_META } from "@/components/app/social/status-meta";
import { openNotebookModal } from "@/components/app/NotebookReaderModal";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyBentoIcon as LayoutGrid,
  HublyBuildingIcon as Building2,
  HublyCalendarIcon as Calendar,
  HublyChatIcon as MessageSquare,
  HublyClipboardIcon as CheckSquare,
  HublyDocumentIcon as FileText,
  HublyEnterIcon as CornerDownLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyCloseIcon as Close,
  HublyArrowUpIcon as ArrowUp,
  HublyArrowDownIcon as ArrowDown,
  HublyMegaphoneIcon as Megaphone,
  HublyNotebookIcon as BookOpen,
  HublyPeopleIcon as Users,
  HublyPersonIcon as UserPlus,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
  HublySettingsIcon as Settings,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

interface CommandPaletteModalProps {
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

// Todas salen de lo que Hubi ya sabe responder o de lo que la paleta ya encuentra.
const TYPED_EXAMPLES = [
  "¿Qué tareas vencen hoy?",
  "¿Qué posts esperan aprobación?",
  "Salud de cuentas",
  "Crear o programar post",
  "Ideas de copy para mi marca",
];

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Menor es mejor; null si falta alguna palabra de la búsqueda.
function scoreItem(item: CommandItem, words: string[], phrase: string): number | null {
  const label = normalize(item.label);
  const rest = normalize([item.sublabel, item.group, item.badge].filter(Boolean).join(" "));
  if (!words.every((word) => label.includes(word) || rest.includes(word))) return null;
  if (label.startsWith(phrase)) return 0;
  if (label.includes(` ${phrase}`)) return 1;
  return label.includes(phrase) ? 2 : 3;
}

function rankItems(items: CommandItem[], query: string): CommandItem[] {
  const phrase = normalize(query);
  const words = phrase.split(/\s+/);
  const scored = items.flatMap((item) => {
    const score = scoreItem(item, words, phrase);
    return score === null ? [] : [{ item, score }];
  });
  // Cada grupo se mantiene junto para que las flechas recorran la lista en el orden en que se ve.
  const groupScore = new Map<string, number>();
  scored.forEach(({ item, score }) => {
    groupScore.set(item.group, Math.min(score, groupScore.get(item.group) ?? score));
  });
  const groupOrder = [...groupScore.keys()].sort((a, b) => groupScore.get(a)! - groupScore.get(b)!);
  return scored
    .sort((a, b) => groupOrder.indexOf(a.item.group) - groupOrder.indexOf(b.item.group) || a.score - b.score)
    .map(({ item }) => item);
}

function dueText(iso: string): string {
  const label = dueLabelFor(iso);
  if (!iso) return label;
  const verb = iso < localIsoDate() ? "Venció" : "Vence";
  return `${verb} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const listId = useId();
  const keyboardSelection = useRef(true);
  const [shortcut, setShortcut] = useState("Ctrl K");

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
  const setAiDrawerPrompt = useHublyStore((s) => s.setAiDrawerPrompt);

  const isOpen = openProp !== undefined ? openProp : cmdkOpen;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleClose = useCallback(() => {
    if (onCloseProp) {
      onCloseProp();
    } else {
      setCmdkOpen(false);
    }
  }, [onCloseProp, setCmdkOpen]);


  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) handleClose();
        else setCmdkOpen(true);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [isOpen, handleClose, setCmdkOpen]);

  // Reset search query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const askHubi = useCallback((question: string) => {
    handleClose();
    window.requestAnimationFrame(() => {
      setAiDrawerPrompt(question);
      setAiDrawerOpen(true);
    });
  }, [handleClose, setAiDrawerOpen, setAiDrawerPrompt]);

  const allItems = useMemo<CommandItem[]>(() => {
    // Cerrada no arma resultados: así el render del servidor no lee la fecha actual.
    if (!isOpen) return [];
    const q = query.trim();

    const quickActions: CommandItem[] = [
      {
        id: "act-composer",
        group: "Acciones",
        label: "Crear o programar post",
        sublabel: "Abre el compositor de posts, Reels y Stories",
        icon: <Plus size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => openComposer(null));
        },
      },
      {
        id: "act-new-brand",
        group: "Acciones",
        label: "Crear marca",
        sublabel: "Configura identidad y compromisos mensuales",
        icon: <Building2 size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setNewBrandModalOpen(true));
        },
      },
      {
        id: "act-invite-team",
        group: "Acciones",
        label: "Invitar al equipo",
        sublabel: "Genera una invitación con rol y marcas asignadas",
        icon: <UserPlus size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setInviteModalOpen(true));
        },
      },
      {
        id: "act-suggestions",
        group: "Acciones",
        label: "Revisar sugerencias",
        sublabel: "Compromisos propuestos según el cumplimiento del último mes",
        icon: <Sparkles size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setAutoSuggestionsModalOpen(true));
        },
      },
      {
        id: "act-widgets",
        group: "Acciones",
        label: "Configurar widgets",
        sublabel: "Agrega o quita widgets de Inicio",
        icon: <LayoutGrid size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setWidgetConfigModalOpen(true));
        },
      },
      {
        id: "act-hubly-ai",
        group: "Acciones",
        label: "Pregúntale a Hubi",
        sublabel: "Consulta tareas vencidas, salud de cuentas y aprobaciones",
        icon: <HublyCatAvatar size={24} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => setAiDrawerOpen(true));
        },
      },
    ];

    const navigationItems: CommandItem[] = [
      {
        id: "nav-dashboard",
        group: "Páginas",
        label: "Dashboard · Inicio",
        sublabel: "Resumen operativo, tareas, libretas y aprobaciones",
        icon: <LayoutGrid size={17} />,
        action: () => {
          handleClose();
          router.push("/dashboard");
        },
      },
      {
        id: "nav-cuentas",
        group: "Páginas",
        label: "Dashboard · Salud de cuentas",
        sublabel: "Cumplimiento de entregas, presupuesto y estado de pauta",
        icon: <Sparkles size={17} />,
        action: () => {
          handleClose();
          router.push("/dashboard/salud-cuentas");
        },
      },
      {
        id: "nav-equipo",
        group: "Páginas",
        label: "Dashboard · Equipo",
        sublabel: "Carga operativa, actividad semanal e invitaciones",
        icon: <Users size={17} />,
        action: () => {
          handleClose();
          router.push("/dashboard/equipo");
        },
      },
      {
        id: "nav-tareas",
        group: "Páginas",
        label: "Mi espacio · Tareas y libretas",
        sublabel: "Entregables y notas de estrategia",
        icon: <CheckSquare size={17} />,
        action: () => {
          handleClose();
          router.push("/tareas");
        },
      },
      {
        id: "nav-calendario",
        group: "Páginas",
        label: "Calendario",
        sublabel: "Planeación mensual de posts",
        icon: <Calendar size={17} />,
        action: () => {
          handleClose();
          router.push("/calendario");
        },
      },
      {
        id: "nav-parrillas",
        group: "Páginas",
        label: "Social Media · Parrillas",
        sublabel: "Parrilla de posts y flujo de aprobación",
        icon: <FileText size={17} />,
        action: () => {
          handleClose();
          router.push("/parrillas");
        },
      },
      {
        id: "nav-marca",
        group: "Páginas",
        label: "Núcleo de marca",
        sublabel: "Qué vende la marca, su categoría y sus buyer personas",
        icon: <BookOpen size={17} />,
        action: () => {
          handleClose();
          router.push("/marca");
        },
      },
      {
        id: "nav-anuncios",
        group: "Páginas",
        label: "Ads · Anuncios",
        sublabel: "Gasto, visitas y CTR de tus anuncios",
        icon: <Megaphone size={17} />,
        action: () => {
          handleClose();
          router.push("/anuncios");
        },
      },
      {
        id: "nav-chat",
        group: "Páginas",
        label: "Chat",
        sublabel: "Mensajes directos y canales por marca",
        icon: <MessageSquare size={17} />,
        action: () => {
          handleClose();
          router.push("/chat");
        },
      },
      {
        id: "nav-ajustes",
        group: "Páginas",
        label: "Ajustes",
        sublabel: "Perfil, cuenta, notificaciones, equipo y marcas",
        icon: <Settings size={17} />,
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
        <span className="hubly-command-brand" style={{ background: b.color }}>
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
        sublabel: `${b?.name || "Agencia"} · ${t.assignee}${t.completed ? "" : ` · ${dueText(t.dueDate)}`}`,
        badge: t.completed ? "Completada" : capitalize(String(t.priority)),
        icon: <CheckSquare size={17} />,
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
        group: "Posts",
        label: p.title,
        sublabel: `${b?.name || "Marca"} · ${p.network || p.networks?.[0] || "Instagram"} (${p.format}) · ${dueLabelFor(p.scheduledDate)}`,
        badge: STATUS_META[p.status]?.label || p.statusLabel || p.status,
        icon: <FileText size={17} />,
        action: () => {
          handleClose();
          window.requestAnimationFrame(() => openComposer(p.id));
        },
      };
    });

    const notebookItems: CommandItem[] = notebooks.map((nb) => ({
      id: `nb-${nb.id}`,
      group: "Libretas",
      label: nb.title,
      sublabel: nb.subtitle,
      badge: nb.category || nb.stamp || "Libreta",
      icon: <BookOpen size={17} />,
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
      icon: <Users size={17} />,
      action: () => {
        handleClose();
        router.push("/dashboard/equipo");
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

    const results = rankItems(combined, q);
    if (!/[¿?]/.test(q)) return results;
    return [
      {
        id: "ask-hubi",
        group: "Hubi",
        label: `Preguntar a Hubi: ${q}`,
        sublabel: "Responde con tus tareas, posts y marcas",
        icon: <HublyCatAvatar size={24} />,
        action: () => askHubi(q),
      },
      ...results,
    ];
  }, [
    isOpen,
    query,
    brands,
    activeBrandId,
    tasks,
    posts,
    notebooks,
    teamMembers,
    router, handleClose, askHubi, openComposer, setActiveBrand, setNewBrandModalOpen,
    setInviteModalOpen, setAutoSuggestionsModalOpen, setWidgetConfigModalOpen, setAiDrawerOpen,
  ]);

  // Opening owns focus and scroll lock; typing and selection never restart it.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const rafId = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(rafId);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const activeIndex = Math.min(selectedIndex, Math.max(0, allItems.length - 1));
  useEffect(() => {
    if (isOpen && keyboardSelection.current) {
      dialogRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen, activeIndex, allItems]);

  const updateQuery = (value: string) => {
    keyboardSelection.current = true;
    setQuery(value);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.target === inputRef.current) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        keyboardSelection.current = true;
        const direction = e.key === "ArrowDown" ? 1 : -1;
        setSelectedIndex(allItems.length ? (activeIndex + direction + allItems.length) % allItems.length : 0);
      } else if (e.key === "Enter" && allItems[activeIndex]) {
        e.preventDefault();
        allItems[activeIndex].action();
      }
    }
    if (e.key === "Tab") {
      const focusables = getFocusableElements(dialogRef.current);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  const typedExample = useTypedText(TYPED_EXAMPLES, isOpen && !query);

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
    <Modal
      open={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      overlayClassName="hubly-overlay hubly-cal-overlay hubly-command-overlay"
      className="hubly-sheet hubly-cal-modal hubly-command"
      surfaceRef={dialogRef}
      onKeyDown={handleKeyDown}
    >
      <div className="hubly-command-search">
        <Search size={18} />
        <div className="hubly-command-field" data-typing={typedExample !== null || undefined}>
          <label id={titleId} htmlFor={`${listId}-input`}>Buscar en Hubly</label>
          <div className="hubly-command-input">
            <input
              id={`${listId}-input`}
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={allItems[activeIndex] ? `${listId}-${allItems[activeIndex].id}` : undefined}
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="Busca una acción, página o marca…"
            />
            {typedExample !== null && <span className="hubly-command-typed" aria-hidden="true">{typedExample}</span>}
          </div>
        </div>
        {query && (
          <button type="button" className="hubly-cal-modal-close" aria-label="Limpiar búsqueda" title="Limpiar búsqueda"
            onClick={() => { updateQuery(""); inputRef.current?.focus(); }}>
            <Close size={14} />
          </button>
        )}
        <kbd className="hubly-command-shortcut">{shortcut}</kbd>
      </div>

      <div id={listId} className="hubly-command-results" role="listbox" tabIndex={-1} aria-label="Resultados de búsqueda">
        {groupedSections.map((section, groupIndex) => (
          <div key={section.group} role="group" aria-labelledby={`${listId}-group-${groupIndex}`} className="hubly-command-group">
            <div id={`${listId}-group-${groupIndex}`} className="hubly-command-heading">{section.group}</div>
            {section.entries.map(({ item, flatIdx }) => (
              <div
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={flatIdx === activeIndex}
                tabIndex={-1}
                className="hubly-command-option"
                onPointerMove={(e) => { if (e.pointerType === "mouse") { keyboardSelection.current = false; setSelectedIndex(flatIdx); } }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.action}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); item.action(); } }}
              >
                <span className="hubly-command-icon" aria-hidden="true">{item.icon}</span>
                <span className="hubly-command-copy">
                  <span className="hubly-command-label" title={item.label}>{item.label}</span>
                  {item.sublabel && <span className="hubly-command-description" title={item.sublabel}>{item.sublabel}</span>}
                </span>
                {item.badge && <span className="hubly-command-meta">{item.badge}</span>}
                <ChevronRight size={14} className="hubly-command-chevron" aria-hidden="true" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {allItems.length === 0 && (
        <div className="hubly-cal-empty hubly-command-empty" role="status">
          <Search size={22} aria-hidden="true" />
          <strong>Sin resultados para «{query}»</strong>
          <span>Prueba con otro nombre o limpia la búsqueda.</span>
          <div className="hubly-command-empty-actions">
            <button type="button" className="hbtn hbtn-secondary" onClick={() => { updateQuery(""); inputRef.current?.focus(); }}>Limpiar búsqueda</button>
            <button type="button" className="hbtn hbtn-secondary" onClick={() => askHubi(query.trim())}>Preguntar a Hubi</button>
          </div>
        </div>
      )}
      <span className="sr-only" role="status">{allItems.length ? `${allItems.length} resultados` : ""}</span>

      <div className="hubly-command-footer">
        <div className="hubly-command-hints" aria-hidden="true">
          <span><kbd><ArrowUp size={14} /></kbd><kbd><ArrowDown size={14} /></kbd> Navegar</span>
          <span><kbd><CornerDownLeft size={14} /></kbd> Abrir</span>
        </div>
        <span className="hubly-command-touch-hint">Toca un resultado para abrirlo</span>
        <button type="button" className="hubly-command-close" onClick={handleClose}><kbd>Esc</kbd> Cerrar</button>
      </div>
    </Modal>
  );
}

