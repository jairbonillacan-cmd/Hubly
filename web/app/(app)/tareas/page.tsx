"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Check,
  LayoutGrid,
  Columns,
  Table as TableIcon,
  Calendar as CalendarIcon,
  GitCommitHorizontal,
  FolderKanban,
  ArrowUpDown,
  Eye,
  Filter,
  ListFilter,
  BookOpen,
  Folder,
  Sparkles,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { moveInList, useKanbanDrag } from "@/lib/use-kanban-drag";
import { KanbanDropSlot } from "@/components/app/KanbanDropSlot";

const TASK_BOARD_STORAGE_KEY = "hubly:tareas:tablero:v1";
const KANBAN_COLUMNS = ["todo", "in_progress", "done"] as const;

interface LocalChecklistItem {
  id: string;
  listId: string;
  title: string;
  highlighted?: boolean;
  assigneeInitial: string;
  dueLabel: string;
  isToday?: boolean;
  done: boolean;
  status: "todo" | "in_progress" | "done";
}

interface LocalTaskList {
  id: string;
  emoji: string;
  name: string;
  accentColor: string;
}

interface KraftNotebook {
  id: string;
  title: string;
  brandName: string;
  updatedAt: string;
  coverStyle: "kraft" | "indigo" | "charcoal";
  pagesCount: number;
  content: string;
}

const INITIAL_LISTS: LocalTaskList[] = [
  {
    id: "list-primeros-pasos",
    emoji: "🚀",
    name: "Primeros pasos",
    accentColor: "#6C77C1",
  },
];

const INITIAL_ITEMS: LocalChecklistItem[] = [
  {
    id: "step-1",
    listId: "list-primeros-pasos",
    title: "Conecta las redes de tu cliente",
    highlighted: true,
    assigneeInitial: "J",
    dueLabel: "Hoy",
    isToday: true,
    done: false,
    status: "todo",
  },
  {
    id: "step-2",
    listId: "list-primeros-pasos",
    title: "Manda tu primer reporte",
    highlighted: true,
    assigneeInitial: "J",
    dueLabel: "Mañana",
    isToday: false,
    done: false,
    status: "todo",
  },
  {
    id: "step-3",
    listId: "list-primeros-pasos",
    title: "Arma la parrilla del mes",
    highlighted: false,
    assigneeInitial: "J",
    dueLabel: "En 2 días",
    isToday: false,
    done: false,
    status: "in_progress",
  },
  {
    id: "step-4",
    listId: "list-primeros-pasos",
    title: "Súmale a tu equipo",
    highlighted: false,
    assigneeInitial: "J",
    dueLabel: "En 3 días",
    isToday: false,
    done: false,
    status: "todo",
  },
];

const INITIAL_NOTEBOOKS: KraftNotebook[] = [
  {
    id: "nb-1",
    title: "Bitácora Creativa · Min",
    brandName: "Min",
    updatedAt: "Editado hoy · 10:30",
    coverStyle: "kraft",
    pagesCount: 6,
    content:
      "• Ideas de Reels en taller de Guadalajara:\n1. ASMR del corte de cuero vegetal y costura Goodyear welt.\n2. Comparativa real: Bota nueva vs 18 meses de uso continuo.\n3. Entrevista corta con el maestro talabartero.",
  },
  {
    id: "nb-2",
    title: "Hooks y Guiones · Q4",
    brandName: "Agencia",
    updatedAt: "Ayer",
    coverStyle: "kraft",
    pagesCount: 4,
    content:
      "• Estructura ganadora de 3 segundos:\n- Gancho visual en movimiento + subtítulo amarillo.\n- Problema concreto del cliente ideal.\n- Cierre con llamado directo a WhatsApp o liga en bio.",
  },
  {
    id: "nb-3",
    title: "Acuerdos de Junta Mensual",
    brandName: "Café Bruma",
    updatedAt: "Hace 3 días",
    coverStyle: "indigo",
    pagesCount: 3,
    content:
      "• Priorizar el lanzamiento de suscripciones para oficinas en CDMX.\n• Ajustar horario de publicación de los sábados a las 8:00 am.",
  },
];

export default function TareasPage() {
  const projects = useHublyStore((s) => s.projects);
  const assets = useHublyStore((s) => s.assets);
  const addTask = useHublyStore((s) => s.addTask);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const [topSection, setTopSection] = useState<"listas" | "libretas" | "contenido">("listas");
  const [subView, setSubView] = useState<
    "cards" | "kanban" | "tabla" | "calendario" | "timeline" | "proyectos"
  >("cards");

  const [lists, setLists] = useState<LocalTaskList[]>(INITIAL_LISTS);
  const [items, setItems] = useState<LocalChecklistItem[]>(INITIAL_ITEMS);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Libretas state
  const [notebooks, setNotebooks] = useState<KraftNotebook[]>(INITIAL_NOTEBOOKS);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);

  const boardLoaded = useRef(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("seccion") === "libretas") {
      setTopSection("libretas");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TASK_BOARD_STORAGE_KEY) || "null");
      if (Array.isArray(saved?.lists) && Array.isArray(saved?.items)) {
        setLists(saved.lists);
        setItems(saved.items);
      }
    } catch {
      // Sin almacenamiento disponible el tablero funciona solo en esta sesión.
    }
  }, []);

  useEffect(() => {
    if (!boardLoaded.current) {
      boardLoaded.current = true;
      return;
    }
    try {
      localStorage.setItem(TASK_BOARD_STORAGE_KEY, JSON.stringify({ lists, items }));
    } catch {
      // Sin almacenamiento disponible el tablero funciona solo en esta sesión.
    }
  }, [lists, items]);

  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns: KANBAN_COLUMNS,
    onMove: (id, toCol, beforeId) => {
      const status = toCol as LocalChecklistItem["status"];
      setItems((prev) =>
        moveInList(prev, id, beforeId, (it) => ({ ...it, status, done: status === "done" }))
      );
    },
  });

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              done: !it.done,
              status: !it.done ? "done" : "todo",
            }
          : it
      )
    );
  };

  const handleAddTaskToList = (listId: string, e: React.FormEvent) => {
    e.preventDefault();
    const val = (draftInputs[listId] || "").trim();
    if (!val) return;
    const created: LocalChecklistItem = {
      id: `step-${Date.now()}`,
      listId,
      title: val,
      highlighted: false,
      assigneeInitial: "J",
      dueLabel: "Hoy",
      isToday: true,
      done: false,
      status: "todo",
    };
    setItems((prev) => [...prev, created]);
    setDraftInputs((prev) => ({ ...prev, [listId]: "" }));

    addTask({
      brandId: activeBrandId || "brand-min",
      title: val,
      dueLabel: "Hoy",
      dueDate: "2026-10-30",
      assignee: "Jair",
      listName: lists.find((l) => l.id === listId)?.name || "Primeros pasos",
      status: "todo",
      priority: "alta",
    });
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim() || `Lista ${lists.length + 1}`;
    setLists((prev) => [
      ...prev,
      {
        id: `list-${Date.now()}`,
        emoji: "📌",
        name,
        accentColor: "#6C77C1",
      },
    ]);
    setNewListName("");
    setCreatingList(false);
  };

  const handleCreateNotebook = () => {
    const created: KraftNotebook = {
      id: `nb-${Date.now()}`,
      title: `Nueva libreta #${notebooks.length + 1}`,
      brandName: "Min",
      updatedAt: "Ahora mismo",
      coverStyle: "kraft",
      pagesCount: 1,
      content: "Escribe aquí tus notas, ideas de contenido o minutas de cliente...",
    };
    setNotebooks((prev) => [...prev, created]);
    setActiveNotebookId(created.id);
  };

  const filteredItems = items.filter(
    (it) => !searchQuery.trim() || it.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId) || null;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "12px 0 40px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ROW 1: Top Segmented Pill Bar + Right Actions (matching 05-todos-mi-espacio-1440.png) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        {/* Left Pill Group (#F1F5F9): Listas | Libretas | Contenido */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#F1F5F9",
            padding: 4,
            borderRadius: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setTopSection("listas")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "listas" ? "#FFFFFF" : "transparent",
              color: topSection === "listas" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "listas" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            {/* Yellow notepad icon matching screenshot */}
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: "#9099D3",
                color: "#4C56A0",
                fontSize: 10,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              ≡
            </span>
            <span>Listas</span>
          </button>

          <button
            type="button"
            onClick={() => setTopSection("libretas")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "libretas" ? "#FFFFFF" : "transparent",
              color: topSection === "libretas" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "libretas" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            <BookOpen size={14} style={{ color: "#94A3B8" }} />
            <span>Libretas</span>
          </button>

          <button
            type="button"
            onClick={() => setTopSection("contenido")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "contenido" ? "#FFFFFF" : "transparent",
              color: topSection === "contenido" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "contenido" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            <Folder size={14} style={{ color: "#94A3B8" }} />
            <span>Contenido</span>
          </button>
        </div>

        {/* Right Actions: Search + Nueva Lista buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Exact 36x36 '+' button from 05-todos-mi-espacio-1440.png top-right */}
          <button
            type="button"
            onClick={() => setCreatingList(true)}
            aria-label="Nueva lista"
            title="Nueva lista"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#6C77C1",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {/* SECTION 1: LISTAS */}
      {topSection === "listas" && (
        <>
          {/* ROW 2: View Switcher Pills + Right Toolbar Icons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {/* Left View Switcher Pills: Cards | Kanban | Tabla | Calendario | Timeline | Proyectos */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  { id: "cards", label: "Cards", icon: LayoutGrid },
                  { id: "kanban", label: "Kanban", icon: Columns },
                  { id: "tabla", label: "Tabla", icon: TableIcon },
                  { id: "calendario", label: "Calendario", icon: CalendarIcon },
                  { id: "timeline", label: "Timeline", icon: GitCommitHorizontal },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = subView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubView(tab.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 11px",
                      borderRadius: 8,
                      border: "none",
                      background: active ? "#F0F1F9" : "transparent",
                      color: active ? "#6C77C1" : "#64748B",
                      fontWeight: active ? 600 : 500,
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Toolbar Icons matching 05-todos-mi-espacio-1440.png */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={() => setSubView("proyectos")}
                title="Mostrar listas de proyectos"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "#64748B",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <FolderKanban size={14} />
              </button>
              <button
                type="button"
                title="Agrupar las tareas"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "#64748B",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <ListFilter size={14} />
              </button>
              <button
                type="button"
                title="Ordenado por fecha — clic para orden manual"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "none",
                  background: "#F0F1F9",
                  color: "#6C77C1",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <ArrowUpDown size={13} />
              </button>
              <button
                type="button"
                title="Elige qué se ve en cada tarea"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "#64748B",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                title="Filtrar tareas"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "#64748B",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Filter size={14} />
              </button>
            </div>
          </div>

          {/* SUBVIEW: CARDS (Default view matching 05-todos-mi-espacio-1440.png 1:1) */}
          {subView === "cards" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
                gap: 24,
                alignItems: "stretch",
              }}
            >
              {lists.map((list) => {
                const listItems = filteredItems.filter((it) => it.listId === list.id);
                const pendingCount = listItems.filter((it) => !it.done).length;
                return (
                  <div
                    key={list.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      padding: "20px 22px 18px",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 12,
                        borderBottom: `2px solid ${list.accentColor}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{list.emoji}</span>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0F172A",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {list.name}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          type="button"
                          title="Compartir esta lista"
                          aria-label="Compartir esta lista"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            border: "1px dashed #CBD5E1",
                            background: "#FFFFFF",
                            color: "#94A3B8",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          title="Opciones de la lista"
                          aria-label={`Opciones de ${list.name}`}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#94A3B8",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Table Column Headers: TAREA | RESP. | FECHA */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 56px 76px",
                        alignItems: "center",
                        padding: "10px 0 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94A3B8",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span>TAREA</span>
                      <span style={{ textAlign: "center" }}>RESP.</span>
                      <span style={{ textAlign: "right" }}>FECHA</span>
                    </div>

                    {/* Checklist Rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {listItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") toggleItem(item.id);
                          }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 56px 76px",
                            alignItems: "center",
                            minHeight: 48,
                            padding: "6px 0",
                            cursor: "pointer",
                          }}
                        >
                          {/* Task Checkbox + Title */}
                          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 999,
                                border: item.done ? "none" : "1.5px solid #CBD5E1",
                                background: item.done ? "#6C77C1" : "#FFFFFF",
                                color: "#FFFFFF",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.done && <Check size={11} strokeWidth={2.8} />}
                            </span>

                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 500,
                                color: item.done ? "#94A3B8" : "#1E293B",
                                textDecoration: item.done ? "line-through" : "none",
                                background:
                                  item.highlighted && !item.done ? "#ECEEF8" : "transparent",
                                padding: item.highlighted ? "1px 5px" : 0,
                                borderRadius: 4,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.title}
                            </span>
                          </div>

                          {/* Assignee Avatar 'J' */}
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <span
                              title="Responsable: Jair · clic para cambiar"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 999,
                                background: "#E0E7FF",
                                color: "#6C77C1",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              {item.assigneeInitial}
                            </span>
                          </div>

                          {/* Due Date Label */}
                          <div
                            style={{
                              textAlign: "right",
                              fontSize: 12,
                              fontWeight: item.isToday ? 600 : 500,
                              color: "#94A3B8",
                            }}
                          >
                            {item.dueLabel}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer: + Agregar tarea... / + Nueva tarea */}
                    <form
                      onSubmit={(e) => handleAddTaskToList(list.id, e)}
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Plus size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                      <input
                        type="text"
                        value={draftInputs[list.id] || ""}
                        onChange={(e) =>
                          setDraftInputs((prev) => ({ ...prev, [list.id]: e.target.value }))
                        }
                        placeholder="Agregar tarea..."
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: 13,
                          color: "#0F172A",
                        }}
                      />
                      {(draftInputs[list.id] || "").trim() && (
                        <button
                          type="submit"
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "none",
                            background: "#6C77C1",
                            color: "#FFFFFF",
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Guardar
                        </button>
                      )}
                    </form>
                  </div>
                );
              })}

              {/* Right Card: Dashed '+ Nueva lista' Box matching 05-todos-mi-espacio-1440.png 1:1 */}
              {creatingList ? (
                <form
                  onSubmit={handleCreateList}
                  style={{
                    borderRadius: 16,
                    border: "1.5px dashed #6C77C1",
                    minHeight: 329,
                    padding: 28,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background: "#F8FAFC",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    Nombre de la nueva lista
                  </div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ej. Entregables de Noviembre"
                    autoFocus
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13.5,
                      width: "100%",
                      maxWidth: 280,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCreatingList(false)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        color: "#64748B",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: "7px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#6C77C1",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Crear lista
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingList(true)}
                  style={{
                    borderRadius: 16,
                    border: "1.5px dashed #CBD5E1",
                    minHeight: 329,
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "#6C77C1",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={15} />
                  <span>Nueva lista</span>
                </button>
              )}
            </div>
          )}

          {/* SUBVIEW: KANBAN */}
          {subView === "kanban" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
                gap: 18,
              }}
            >
              {(
                [
                  { key: "todo", title: "Por hacer", dot: "#6C77C1" },
                  { key: "in_progress", title: "En progreso", dot: "#6C77C1" },
                  { key: "done", title: "Completadas", dot: "#10B981" },
                ] as const
              ).map((col) => {
                const colItems = filteredItems.filter((it) => it.status === col.key);
                return (
                  <div
                    key={col.key}
                    {...getColumnProps(col.key)}
                    style={{
                      background: drag?.overCol === col.key ? "#F0F1F9" : "#F8FAFC",
                      borderRadius: 14,
                      border: `1px solid ${drag?.overCol === col.key ? "#6C77C1" : "#E2E8F0"}`,
                      padding: 16,
                      minHeight: 160,
                      transition: "background 120ms ease, border-color 120ms ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: col.dot,
                          }}
                        />
                        {col.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#E2E8F0",
                          color: "#475569",
                        }}
                      >
                        {colItems.length}
                      </span>
                    </div>

                    {colItems.map((it) => (
                      <React.Fragment key={it.id}>
                      {drag?.overCol === col.key && drag.beforeId === it.id && (
                        <KanbanDropSlot height={drag.height} />
                      )}
                      <div
                        {...getCardProps(it.id)}
                        onClick={() => toggleItem(it.id)}
                        style={{
                          background: "#FFFFFF",
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          padding: "12px 14px",
                          cursor: drag?.id === it.id ? "grabbing" : "grab",
                          opacity: drag?.id === it.id ? 0.35 : 1,
                          boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                          {(() => {
                            const list = lists.find((l) => l.id === it.listId);
                            return list ? `${list.emoji} ${list.name}` : "";
                          })()}
                        </div>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: it.done ? "#94A3B8" : "#0F172A",
                            textDecoration: it.done ? "line-through" : "none",
                            marginBottom: 10,
                          }}
                        >
                          {it.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              background: "#F0F1F9",
                              color: "#6C77C1",
                              fontSize: 11,
                              fontWeight: 700,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            {it.assigneeInitial}
                          </span>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: it.isToday ? "#EF4444" : "#64748B",
                            }}
                          >
                            {it.dueLabel}
                          </span>
                        </div>
                      </div>
                      </React.Fragment>
                    ))}
                    {drag?.overCol === col.key && drag.beforeId === null && (
                      <KanbanDropSlot height={drag.height} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SUBVIEW: TABLA */}
          {subView === "tabla" && (
            <div
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                overflow: "hidden",
                background: "#FFFFFF",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr
                    style={{
                      background: "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <th style={{ padding: "12px 16px", width: 44 }}></th>
                    <th style={{ padding: "12px 16px" }}>Tarea</th>
                    <th style={{ padding: "12px 16px" }}>Lista</th>
                    <th style={{ padding: "12px 16px" }}>Responsable</th>
                    <th style={{ padding: "12px 16px" }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((it) => (
                    <tr
                      key={it.id}
                      onClick={() => toggleItem(it.id)}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 999,
                            border: it.done ? "none" : "1.5px solid #CBD5E1",
                            background: it.done ? "#6C77C1" : "#FFFFFF",
                            color: "#FFFFFF",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {it.done && <Check size={11} />}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontWeight: 600,
                          color: it.done ? "#94A3B8" : "#0F172A",
                          textDecoration: it.done ? "line-through" : "none",
                        }}
                      >
                        <span
                          style={{
                            background: it.highlighted && !it.done ? "#ECEEF8" : "transparent",
                            padding: it.highlighted ? "1px 5px" : 0,
                            borderRadius: 4,
                          }}
                        >
                          {it.title}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>🚀 Primeros pasos</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12.5,
                            color: "#334155",
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              background: "#F0F1F9",
                              color: "#6C77C1",
                              fontSize: 10.5,
                              fontWeight: 700,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            {it.assigneeInitial}
                          </span>
                          Jair
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontWeight: 600,
                          color: it.isToday ? "#EF4444" : "#64748B",
                        }}
                      >
                        {it.dueLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUBVIEW: CALENDARIO / TIMELINE / PROYECTOS */}
          {(subView === "calendario" || subView === "timeline" || subView === "proyectos") && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {projects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: 14,
                    border: "1px solid #E2E8F0",
                    padding: 18,
                    background: "#FFFFFF",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#F0F1F9",
                        color: "#6C77C1",
                      }}
                    >
                      {p.status}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Entrega: {p.dueDate}</span>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 12 }}>
                    {p.description}
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: "#F1F5F9",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${p.progress}%`,
                        height: "100%",
                        background: "#6C77C1",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SECTION 2: LIBRETAS (Kraft Notebooks) */}
      {topSection === "libretas" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: "0 0 3px" }}>
                Libretas de trabajo
              </h2>
              <p style={{ fontSize: 12.5, color: "#94A3B8", margin: 0 }}>
                Notas rápidas, minutas de cliente e ideas creativas en formato libreta Kraft.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNotebook}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: "#6C77C1",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Plus size={14} />
              <span>Nueva libreta</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {notebooks.map((nb) => {
              const isKraft = nb.coverStyle === "kraft";
              const bg = isKraft
                ? "linear-gradient(145deg, #D8B48A 0%, #C69C6D 100%)"
                : "linear-gradient(145deg, #6C77C1 0%, #4C56A0 100%)";
              const textColor = isKraft ? "#3E2723" : "#FFFFFF";
              return (
                <div
                  key={nb.id}
                  onClick={() => setActiveNotebookId(nb.id)}
                  style={{
                    height: 265,
                    borderRadius: "6px 16px 16px 6px",
                    background: bg,
                    padding: "20px 18px 18px 24px",
                    position: "relative",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
                    border: activeNotebookId === nb.id ? "2px solid #0F172A" : "none",
                  }}
                >
                  {/* Notebook Spine */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 12,
                      background: "rgba(0,0,0,0.22)",
                      borderRadius: "6px 0 0 6px",
                    }}
                  />

                  {/* Paper Label Sticker */}
                  <div
                    style={{
                      background: "#F5F6FB",
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#4C56A0",
                        marginBottom: 4,
                      }}
                    >
                      {nb.brandName}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.3,
                      }}
                    >
                      {nb.title}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 600,
                      color: textColor,
                      opacity: 0.85,
                    }}
                  >
                    <span>{nb.updatedAt}</span>
                    <span>{nb.pagesCount} págs.</span>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleCreateNotebook}
              style={{
                height: 265,
                borderRadius: 16,
                border: "1.5px dashed #CBD5E1",
                background: "transparent",
                color: "#6C77C1",
                fontWeight: 600,
                fontSize: 13.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              <span>+ Nueva libreta</span>
            </button>
          </div>

          {activeNotebook && (
            <div
              style={{
                marginTop: 24,
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                background: "#F5F6FB",
                padding: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                  📓 {activeNotebook.title}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotebookId(null)}
                  style={{
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 12,
                    color: "#64748B",
                    cursor: "pointer",
                  }}
                >
                  Cerrar libreta
                </button>
              </div>
              <textarea
                value={activeNotebook.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setNotebooks((prev) =>
                    prev.map((n) => (n.id === activeNotebook.id ? { ...n, content: val } : n))
                  );
                }}
                rows={5}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  padding: 14,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#1E293B",
                  background: "#FFFFFF",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: CONTENIDO */}
      {topSection === "contenido" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                padding: 16,
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#F0F1F9",
                    color: "#6C77C1",
                    textTransform: "uppercase",
                  }}
                >
                  {asset.kind}
                </span>
                <span style={{ fontSize: 11.5, color: "#94A3B8" }}>{asset.sizeLabel}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{asset.name}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Carpeta: {asset.folder}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {asset.aiTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "#F1F5F9",
                      color: "#475569",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Sparkles size={10} style={{ color: "#6C77C1" }} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
