"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { addDays, dueLabelFor, localIsoDate } from "@/lib/date";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import { KanbanDropSlot } from "@/components/app/KanbanDropSlot";
import { MonthDragCalendar } from "@/components/app/MonthDragCalendar";
import type { AgencyTask, TaskListDef } from "@/lib/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { normalizedStatus, type BoardStatus } from "./task-utils";
import {
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon as CalendarIcon,
  HublyCheckIcon as Check,
  HublyEyeIcon as Eye,
  HublyFilterIcon as Filter,
  HublyFolderIcon as FolderKanban,
  HublyKanbanIcon as Columns,
  HublyMoreIcon as MoreHorizontal,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
  HublySortIcon as ArrowUpDown,
  HublySortIcon as ListFilter,
  HublyTableIcon as TableIcon,
  HublyTimelineIcon as GitCommitHorizontal,
} from "@/components/app/icons/DuotoneIcons";

type SubView = "cards" | "kanban" | "tabla" | "calendario" | "timeline" | "proyectos";
type Popover = "agrupar" | "campos" | "filtro" | null;

const KANBAN_COLUMNS = [
  { key: "todo", title: "Por hacer", dot: "var(--hb-accent)" },
  { key: "in_progress", title: "En progreso", dot: "var(--ui-warning)" },
  { key: "done", title: "Completadas", dot: "var(--ui-success)" },
] as const;
const COLUMN_KEYS = KANBAN_COLUMNS.map((c) => c.key);
const NO_LISTS: TaskListDef[] = [];
const VIEWS = [
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "kanban", label: "Kanban", icon: Columns },
  { id: "tabla", label: "Tabla", icon: TableIcon },
  { id: "calendario", label: "Calendario", icon: CalendarIcon },
  { id: "timeline", label: "Timeline", icon: GitCommitHorizontal },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban },
] as const;
const TIMELINE_DAYS = 28;

export function TaskBoard({ newListSignal }: { newListSignal: number }) {
  const allTasks = useHublyStore((s) => s.tasks);
  const storedLists = useHublyStore((s) => s.taskLists) ?? NO_LISTS;
  const projects = useHublyStore((s) => s.projects);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profileName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const addTask = useHublyStore((s) => s.addTask);
  const updateTask = useHublyStore((s) => s.updateTask);
  const moveTask = useHublyStore((s) => s.moveTask);
  const addTaskList = useHublyStore((s) => s.addTaskList);
  const renameTaskList = useHublyStore((s) => s.renameTaskList);
  const deleteTaskList = useHublyStore((s) => s.deleteTaskList);

  const [subView, setSubView] = useState<SubView>("cards");
  const [popover, setPopover] = useState<Popover>(null);
  const [groupBy, setGroupBy] = useState<"lista" | "responsable">("lista");
  const [sortByDate, setSortByDate] = useState(true);
  const [showAssignee, setShowAssignee] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"todas" | BoardStatus>("todas");
  const [personFilter, setPersonFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [listMenu, setListMenu] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (newListSignal > 0) {
      setSubView("cards"); // eslint-disable-line react-hooks/set-state-in-effect -- señal externa para crear lista
      setCreatingList(true);
    }
  }, [newListSignal]);

  useEffect(() => {
    if (!popover) return;
    const onDown = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) setPopover(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [popover]);

  const brandTasks = useMemo(
    () => allTasks.filter((t) => t.brandId === activeBrandId),
    [allTasks, activeBrandId]
  );

  const listNames = useMemo(() => {
    const names = storedLists.filter((l) => l.brandId === activeBrandId).map((l) => l.name);
    for (const t of brandTasks) if (t.listName && !names.includes(t.listName)) names.push(t.listName);
    return names;
  }, [storedLists, brandTasks, activeBrandId]);

  const people = useMemo(
    () => Array.from(new Set(brandTasks.map((t) => t.assigneeName || t.assignee).filter(Boolean))),
    [brandTasks]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = brandTasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q)) &&
        (statusFilter === "todas" || normalizedStatus(t) === statusFilter) &&
        (personFilter === "todos" || (t.assigneeName || t.assignee) === personFilter)
    );
    return sortByDate ? [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate)) : filtered;
  }, [brandTasks, query, statusFilter, personFilter, sortByDate]);

  const kanban = useKanbanDrag({
    columns: COLUMN_KEYS,
    onMove: (id, toCol, beforeId) => {
      setSortByDate(false);
      moveTask(id, toCol as BoardStatus, beforeId);
    },
  });
  const timelineDrag = useKanbanDrag({
    columns: useMemo(() => Array.from({ length: TIMELINE_DAYS }, (_, i) => addDays(localIsoDate(), i - 3)), []),
    onMove: (id, date) => updateTask(id, { dueDate: date, dueLabel: dueLabelFor(date), dueBucket: undefined }),
  });

  const createTask = (title: string, listName: string, dueDate = localIsoDate(), assignee = profileName) => {
    addTask({
      brandId: activeBrandId,
      title,
      dueLabel: dueLabelFor(dueDate),
      dueDate,
      assignee,
      listName,
      status: "todo",
      priority: "media",
    });
  };

  const toggle = (task: AgencyTask) =>
    moveTask(task.id, normalizedStatus(task) === "done" ? "todo" : "done", null);

  const openTask = allTasks.find((t) => t.id === openTaskId) || null;
  const groups =
    groupBy === "lista"
      ? listNames.map((name) => ({ key: name, name, items: visible.filter((t) => t.listName === name) }))
      : people.map((name) => ({ key: name, name, items: visible.filter((t) => (t.assigneeName || t.assignee) === name) }));
  const filtersOn = statusFilter !== "todas" || personFilter !== "todos";

  const iconBtn = (active: boolean) =>
    ({
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "none",
      background: active ? "var(--ui-accent-soft)" : "transparent",
      color: active ? "var(--hb-accent-text)" : "var(--ui-text-4)",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
    }) as const;

  const checkbox = (task: AgencyTask) => {
    const done = normalizedStatus(task) === "done";
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Completar ${task.title}`}
        onClick={(e) => {
          e.stopPropagation();
          toggle(task);
        }}
        style={{
          width: 18,
          height: 18,
          padding: 0,
          borderRadius: 999,
          border: done ? "none" : "1.5px solid var(--ui-border-strong)",
          background: done ? "var(--hb-accent)" : "var(--ui-surface)",
          color: "var(--on-accent)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        {done && <Check size={11} strokeWidth={2.8} />}
      </button>
    );
  };

  const titleSpan = (task: AgencyTask) => {
    const done = normalizedStatus(task) === "done";
    return (
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: done ? "var(--ui-text-5)" : "var(--ui-text-1)",
          textDecoration: done ? "line-through" : "none",
          background: task.highlighted && !done ? "#E6F4FB" : "transparent",
          padding: task.highlighted ? "1px 5px" : 0,
          borderRadius: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        {task.title}
      </span>
    );
  };

  const avatar = (task: AgencyTask) => (
    <span
      title={`Responsable: ${task.assigneeName || task.assignee}`}
      style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 999, background: "var(--ui-sky-soft)", color: "var(--ui-sky-text)", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}
    >
      {task.assigneeInitial || (task.assigneeName || "?").slice(0, 1)}
    </span>
  );

  const today = localIsoDate();
  const dueColor = (task: AgencyTask) =>
    normalizedStatus(task) !== "done" && task.dueDate < today ? "var(--ui-danger-text)" : task.dueDate === today ? "#334155" : "#64748B";

  const timelineDays = Array.from({ length: TIMELINE_DAYS }, (_, i) => addDays(today, i - 3));
  const timelineRows = listNames.map((name) => ({ name, items: visible.filter((t) => t.listName === name) }));

  return (
    <>
      <div
        ref={toolbarRef}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20, position: "relative" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {VIEWS.map((tab) => {
            const Icon = tab.icon;
            const active = subView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSubView(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? "var(--ui-accent-soft)" : "transparent",
                  color: active ? "var(--ui-accent-text)" : "var(--ui-text-4)",
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

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--ui-border)", borderRadius: 8, padding: "0 8px", height: 30 }}>
            <Search size={13} color="#64748B" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tarea" aria-label="Buscar tarea" style={{ border: 0, outline: 0, fontSize: 12.5, width: 110, background: "transparent" }} />
          </label>
          <button type="button" title="Agrupar las tareas" aria-label="Agrupar las tareas" aria-expanded={popover === "agrupar"} onClick={() => setPopover(popover === "agrupar" ? null : "agrupar")} style={iconBtn(popover === "agrupar" || groupBy !== "lista")}>
            <ListFilter size={14} />
          </button>
          <button
            type="button"
            title={sortByDate ? "Ordenado por fecha — clic para orden manual" : "Orden manual — clic para ordenar por fecha"}
            aria-label="Cambiar orden"
            aria-pressed={sortByDate}
            onClick={() => setSortByDate((v) => !v)}
            style={iconBtn(sortByDate)}
          >
            <ArrowUpDown size={13} />
          </button>
          <button type="button" title="Elige qué se ve en cada tarea" aria-label="Elige qué se ve en cada tarea" aria-expanded={popover === "campos"} onClick={() => setPopover(popover === "campos" ? null : "campos")} style={iconBtn(popover === "campos")}>
            <Eye size={14} />
          </button>
          <button type="button" title="Filtrar tareas" aria-label="Filtrar tareas" aria-expanded={popover === "filtro"} onClick={() => setPopover(popover === "filtro" ? null : "filtro")} style={iconBtn(popover === "filtro" || filtersOn)}>
            <Filter size={14} />
          </button>
        </div>

        {popover && (
          <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, zIndex: 20, width: 220, background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12, boxShadow: "0 12px 28px rgba(15,23,42,0.12)", display: "grid", gap: 8, fontSize: 13 }}>
            {popover === "agrupar" && (
              <>
                <strong style={{ fontSize: 12 }}>Agrupar las cards por</strong>
                {(["lista", "responsable"] as const).map((g) => (
                  <label key={g} style={{ display: "flex", gap: 8, alignItems: "center", textTransform: "capitalize" }}>
                    <input type="radio" name="agrupar" checked={groupBy === g} onChange={() => setGroupBy(g)} />
                    {g}
                  </label>
                ))}
              </>
            )}
            {popover === "campos" && (
              <>
                <strong style={{ fontSize: 12 }}>Mostrar en cada tarea</strong>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={showAssignee} onChange={(e) => setShowAssignee(e.target.checked)} /> Responsable
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} /> Fecha
                </label>
              </>
            )}
            {popover === "filtro" && (
              <>
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Estado
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={select}>
                    <option value="todas">Todas</option>
                    <option value="todo">Por hacer</option>
                    <option value="in_progress">En progreso</option>
                    <option value="done">Completadas</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Responsable
                  <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} style={select}>
                    <option value="todos">Todos</option>
                    {people.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                {filtersOn && (
                  <button type="button" onClick={() => { setStatusFilter("todas"); setPersonFilter("todos"); }} style={{ border: 0, background: "transparent", color: "var(--ui-accent-text-2)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", textAlign: "left", padding: 0 }}>
                    Quitar filtros
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {subView === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))", gap: 24, alignItems: "start" }}>
          {groups.map((group) => {
            const pending = group.items.filter((t) => normalizedStatus(t) !== "done").length;
            return (
              <section key={group.key} style={{ background: "var(--ui-sky-card)", borderRadius: 16, border: "1px solid var(--ui-sky-border)", padding: "20px 22px 18px", position: "relative", boxShadow: "0 1px 2px rgba(26, 26, 46, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "2px solid var(--ui-sky)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ui-text)" }}>{group.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{pending} pendientes</span>
                    {groupBy === "lista" && (
                      <button type="button" aria-label={`Opciones de ${group.name}`} aria-expanded={listMenu === group.key} onClick={() => setListMenu(listMenu === group.key ? null : group.key)} style={iconBtn(false)}>
                        <MoreHorizontal size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {listMenu === group.key && (
                  <div style={{ position: "absolute", right: 22, top: 56, zIndex: 10, background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 10, boxShadow: "0 12px 28px rgba(15,23,42,0.12)", padding: 4, display: "grid" }}>
                    <button
                      type="button"
                      style={menuItem}
                      onClick={async () => {
                        setListMenu(null);
                        const next = await askText("Nuevo nombre de la lista", group.name);
                        if (next && next !== group.name && !listNames.includes(next)) renameTaskList(activeBrandId, group.name, next);
                      }}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      style={{ ...menuItem, color: "var(--ui-danger-text)" }}
                      onClick={async () => {
                        setListMenu(null);
                        const count = brandTasks.filter((t) => t.listName === group.name).length;
                        if (await askConfirm(`¿Eliminar «${group.name}» y sus ${count} tareas?`)) deleteTaskList(activeBrandId, group.name);
                      }}
                    >
                      Eliminar lista
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
                  {group.items.length > 0 && (
                    <div className="hubly-list-head" aria-hidden="true">
                      <span>Tarea</span>
                      {showAssignee && <span style={{ width: 26 }}>Resp.</span>}
                      {showDate && <span style={{ width: 92, textAlign: "right" }}>Fecha</span>}
                    </div>
                  )}
                  {group.items.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: "10px 0" }}>Sin tareas.</p>}
                  {group.items.map((task) => (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenTaskId(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target === e.currentTarget) setOpenTaskId(task.id);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 11, minHeight: 48, padding: "6px 0", cursor: "pointer" }}
                    >
                      {checkbox(task)}
                      <span style={{ flex: 1, minWidth: 0, display: "flex" }}>{titleSpan(task)}</span>
                      {showAssignee && avatar(task)}
                      {showDate && (
                        <span style={{ width: 92, textAlign: "right", fontSize: 12, fontWeight: 500, color: dueColor(task), flexShrink: 0, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {dueLabelFor(task.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {groupBy === "lista" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const title = (drafts[group.key] || "").trim();
                      if (!title) return;
                      createTask(title, group.name);
                      setDrafts((prev) => ({ ...prev, [group.key]: "" }));
                    }}
                    style={{ marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Plus size={14} style={{ color: "var(--ui-text-5)", flexShrink: 0 }} />
                    <input
                      value={drafts[group.key] || ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [group.key]: e.target.value }))}
                      placeholder="Agregar tarea..."
                      aria-label={`Agregar tarea a ${group.name}`}
                      style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 13 }}
                    />
                    {(drafts[group.key] || "").trim() && (
                      <button type="submit" style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "var(--hb-accent)", color: "var(--on-accent)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                        Guardar
                      </button>
                    )}
                  </form>
                )}
              </section>
            );
          })}

          {groupBy === "lista" &&
            (creatingList ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = newListName.trim() || `Lista ${listNames.length + 1}`;
                  if (!listNames.includes(name)) addTaskList(activeBrandId, name);
                  setNewListName("");
                  setCreatingList(false);
                }}
                style={{ borderRadius: 16, border: "1.5px dashed var(--hb-accent)", minHeight: 200, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "var(--ui-surface-2)" }}
              >
                <label htmlFor="new-list-name" style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>Nombre de la nueva lista</label>
                <input id="new-list-name" autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Ej. Entregables de noviembre" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid var(--ui-border-strong)", fontSize: 13.5, width: "100%", maxWidth: 280 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setCreatingList(false)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--ui-border)", background: "var(--ui-surface)", color: "var(--ui-text-3)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                  <button type="submit" style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--hb-accent)", color: "var(--on-accent)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Crear lista</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setCreatingList(true)} style={{ borderRadius: 16, border: "1.5px dashed var(--ui-border-strong)", minHeight: 200, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--ui-accent-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={15} /> Nueva lista
              </button>
            ))}
        </div>
      )}

      {subView === "kanban" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(260px, 1fr))", gap: 18 }}>
            {KANBAN_COLUMNS.map((col) => {
              const items = visible.filter((t) => normalizedStatus(t) === col.key);
              const over = kanban.drag?.overCol === col.key;
              return (
                <div
                  key={col.key}
                  {...kanban.getColumnProps(col.key)}
                  style={{ background: over ? "var(--ui-accent-soft)" : "var(--ui-surface-2)", borderRadius: 14, border: `1px solid ${over ? "var(--hb-accent)" : "var(--ui-border)"}`, padding: 16, minHeight: 160, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--ui-text)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: col.dot }} />
                      {col.title}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--ui-border)", color: "var(--ui-text-3)" }}>{items.length}</span>
                  </div>
                  {items.map((task) => (
                    <React.Fragment key={task.id}>
                      {over && kanban.drag?.beforeId === task.id && <KanbanDropSlot height={kanban.drag.height} />}
                      <div
                        {...kanban.getCardProps(task.id)}
                        onClick={() => setOpenTaskId(task.id)}
                        style={{ background: "var(--ui-surface)", borderRadius: 12, border: "1px solid var(--ui-border)", padding: "12px 14px", cursor: kanban.drag?.id === task.id ? "grabbing" : "grab", opacity: kanban.drag?.id === task.id ? 0.35 : 1 }}
                      >
                        <div style={{ fontSize: 11, color: "var(--ui-text-4)", marginBottom: 4 }}>{task.listName}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: col.key === "done" ? "var(--ui-text-5)" : "var(--ui-text)", textDecoration: col.key === "done" ? "line-through" : "none", marginBottom: 10 }}>{task.title}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {showAssignee ? avatar(task) : <span />}
                          {showDate && <span style={{ fontSize: 11.5, fontWeight: 600, color: dueColor(task) }}>{dueLabelFor(task.dueDate)}</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  {over && kanban.drag?.beforeId === null && <KanbanDropSlot height={kanban.drag.height} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subView === "tabla" && (
        <div style={{ borderRadius: 14, border: "1px solid var(--ui-border)", overflowX: "auto", background: "var(--ui-surface)" }}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--ui-surface-2)", borderBottom: "1px solid var(--ui-border)", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ui-text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "12px 16px", width: 44 }}><span className="sr-only">Hecha</span></th>
                <th style={{ padding: "12px 16px" }}>Tarea</th>
                <th style={{ padding: "12px 16px" }}>Lista</th>
                {showAssignee && <th style={{ padding: "12px 16px" }}>Responsable</th>}
                {showDate && <th style={{ padding: "12px 16px" }}>Fecha</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => (
                <tr key={task.id} onClick={() => setOpenTaskId(task.id)} style={{ borderBottom: "1px solid var(--ui-muted)", cursor: "pointer" }}>
                  <td style={{ padding: "12px 16px" }}>{checkbox(task)}</td>
                  <td style={{ padding: "12px 16px" }}>{titleSpan(task)}</td>
                  <td style={{ padding: "12px 16px", color: "var(--ui-text-3)" }}>{task.listName}</td>
                  {showAssignee && <td style={{ padding: "12px 16px", color: "var(--ui-text-2)" }}>{task.assigneeName || task.assignee}</td>}
                  {showDate && <td style={{ padding: "12px 16px", fontWeight: 600, color: dueColor(task) }}>{dueLabelFor(task.dueDate)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subView === "calendario" && (
        <MonthDragCalendar
          entries={visible.map((task) => {
            const status = normalizedStatus(task);
            return {
              id: task.id,
              date: task.dueDate,
              label: task.title,
              title: `${task.title} · ${task.assigneeName || task.assignee}`,
              bg: status === "done" ? "var(--ui-muted)" : status === "in_progress" ? "var(--ui-warning-soft)" : "var(--ui-accent-soft)",
              color: status === "done" ? "var(--ui-text-3)" : status === "in_progress" ? "var(--ui-warning-text)" : "var(--hb-accent-text)",
              strike: status === "done",
            };
          })}
          hint="Arrastra una tarea para cambiar su fecha"
          addLabel="Nueva tarea"
          onMove={(id, date) => updateTask(id, { dueDate: date, dueLabel: dueLabelFor(date), dueBucket: undefined })}
          onOpen={setOpenTaskId}
          onAdd={async (date) => {
            const title = await askText("Nombre de la tarea", "", "Crear tarea");
            if (title) createTask(title, listNames[0] || "General", date);
          }}
        />
      )}

      {subView === "timeline" && (
        <div style={{ overflowX: "auto", border: "1px solid var(--ui-border)", borderRadius: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: `150px repeat(${TIMELINE_DAYS}, minmax(44px, 1fr))`, minWidth: 150 + TIMELINE_DAYS * 44 }}>
            <div style={{ ...tlHead, position: "sticky", left: 0, zIndex: 3 }}>Lista</div>
            {timelineDays.map((d) => {
              const day = new Date(`${d}T12:00:00`);
              return (
                <div key={d} style={{ ...tlHead, textAlign: "center", color: d === today ? "var(--on-accent)" : "var(--ui-text-4)", background: d === today ? "var(--hb-accent)" : "var(--ui-surface-2)", fontWeight: 700 }}>
                  {day.getDate()}
                  <div style={{ fontSize: 9.5, fontWeight: 600 }}>{day.toLocaleDateString("es-MX", { weekday: "short" })}</div>
                </div>
              );
            })}
            {timelineRows.map((row) => (
              <React.Fragment key={row.name}>
                <div style={{ position: "sticky", left: 0, zIndex: 2, background: "var(--ui-surface)", padding: "10px 12px", borderTop: "1px solid var(--ui-border)", fontSize: 12.5, fontWeight: 700, color: "var(--ui-text)" }}>
                  {row.name}
                </div>
                {timelineDays.map((d) => (
                  <div
                    key={d}
                    {...timelineDrag.getColumnProps(d)}
                    style={{ minHeight: 56, padding: 3, borderTop: "1px solid var(--ui-border)", borderLeft: "1px solid var(--ui-muted)", background: timelineDrag.drag?.overCol === d ? "var(--ui-accent-soft)" : "transparent", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}
                  >
                    {row.items.filter((t) => t.dueDate === d).map((task) => (
                      <div
                        key={task.id}
                        {...timelineDrag.getCardProps(task.id)}
                        onClick={() => setOpenTaskId(task.id)}
                        title={`${task.title} · ${dueLabelFor(task.dueDate)}`}
                        aria-label={task.title}
                        style={{ height: 22, borderRadius: 6, background: normalizedStatus(task) === "done" ? "var(--ui-border-strong)" : "var(--hb-accent)", color: "var(--on-accent)", fontSize: 10.5, fontWeight: 600, padding: "3px 5px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", cursor: "grab", opacity: timelineDrag.drag?.id === task.id ? 0.35 : 1 }}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          {visible.some((t) => !timelineDays.includes(t.dueDate)) && (
            <p style={{ margin: 0, padding: "8px 12px", fontSize: 12, color: "var(--ui-text-4)", borderTop: "1px solid var(--ui-border)" }}>
              {visible.filter((t) => !timelineDays.includes(t.dueDate)).length} tareas tienen fecha fuera de estas 4 semanas.
            </p>
          )}
        </div>
      )}

      {subView === "proyectos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
          {projects.filter((p) => p.brandId === activeBrandId).length === 0 && (
            <p style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>Esta marca aún no tiene proyectos.</p>
          )}
          {projects.filter((p) => p.brandId === activeBrandId).map((p) => (
            <div key={p.id} style={{ borderRadius: 14, border: "1px solid var(--ui-border)", padding: 18, background: "var(--ui-surface)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--ui-accent-soft)", color: "var(--ui-accent-text)" }}>{p.status}</span>
                <span style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>Entrega: {p.dueDate}</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ui-text)", marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--ui-text-4)", marginBottom: 12 }}>{p.description}</div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--ui-muted)", overflow: "hidden" }}>
                <div style={{ width: `${p.progress}%`, height: "100%", background: "var(--hb-accent)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {openTask && <TaskDetailModal key={openTask.id} task={openTask} listNames={listNames} onClose={() => setOpenTaskId(null)} />}
    </>
  );
}

const select = { border: "1px solid var(--ui-border-strong)", borderRadius: 8, padding: "6px 8px", fontSize: 12.5, background: "var(--ui-surface)" } as const;
const menuItem = { border: 0, background: "transparent", padding: "7px 12px", fontSize: 12.5, fontWeight: 600, textAlign: "left", cursor: "pointer", borderRadius: 7, color: "var(--ui-text-2)" } as const;
const tlHead = { padding: "6px 8px", fontSize: 11, fontWeight: 700, color: "var(--ui-text-4)", background: "var(--ui-surface-2)" } as const;
