"use client";

import React, { useMemo, useState } from "react";
import { selectTasksBreakdown } from "@/lib/domain-selectors";
import type { TaskDueBucket, TaskPriority } from "@/lib/types";
import { HublyClipboardIcon } from "@/components/app/icons/HublyIcons";
import { HublyCheckCircleIcon, HublyCheckIcon as Check, HublyPlusIcon as Plus, HublyTrashIcon as Trash2 } from "@/components/app/icons/DuotoneIcons";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { STATUS_META } from "@/components/app/social/status-meta";
import { useActiveBrand } from "@/lib/use-active-brand";

type TasksBreakdown = ReturnType<typeof selectTasksBreakdown>;

/** Tareas de hoy, mañana y próximas, con alta rápida. */
export function TareasWidget({ filterByBrand, setFilterByBrand, tasksBreakdown }: { filterByBrand: boolean; setFilterByBrand: React.Dispatch<React.SetStateAction<boolean>>; tasksBreakdown: TasksBreakdown }) {
  const profile = useHublyStore((s) => s.profile);
  const testClock = useHublyStore((s) => s.testClock);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);
  const addTask = useHublyStore((s) => s.addTask);
  const deleteTask = useHublyStore((s) => s.deleteTask);

  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false);

  const [showQuickTaskForm, setShowQuickTaskForm] = useState<boolean>(false);

  const [newTaskTitle, setNewTaskTitle] = useState<string>("");

  const [newTaskBucket, setNewTaskBucket] = useState<TaskDueBucket>("today");

  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");

  const allBrandsTasksBreakdown = useMemo(
    () =>
      selectTasksBreakdown(
        tasks,
        activeBrandId,
        false,
        testClock?.fixedIsoNow,
        profile?.timezone
      ),
    [tasks, activeBrandId, testClock?.fixedIsoNow, profile?.timezone]
  );

  const activeBrand = useActiveBrand();

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTaskTitle.trim();
    if (!clean) return;
    const dueDateIso =
      newTaskBucket === "today"
        ? tasksBreakdown.todayIso
        : newTaskBucket === "tomorrow"
          ? tasksBreakdown.tomorrowIso
          : tasksBreakdown.todayIso;
    const dueLabelMap: Record<TaskDueBucket, string> = {
      overdue: "Atrasada",
      today: "Hoy",
      tomorrow: "Mañana",
      upcoming: "Próximas",
    };
    addTask({
      brandId: activeBrandId || "brand-min",
      title: clean,
      dueLabel: dueLabelMap[newTaskBucket],
      dueDate: dueDateIso,
      dueBucket: newTaskBucket,
      priority: newTaskPriority,
      assignee: profile?.name || "Jair",
      listName: "General",
      status: "pendiente",
    });
    setNewTaskTitle("");
    setShowQuickTaskForm(false);
  };

    const visibleGroups = tasksBreakdown.groups.filter((g) => g.tasks.length > 0);
    return (
      <section
        key="tareas"
        id="dashboard-tareas-widget"
        data-widget-id="tareas"
        className="hb-widget"
      >
        <div className="hb-widget-head" style={{ flexWrap: "wrap", gap: 8 }}>
          <div className="hb-widget-title">
            <span className="hb-widget-icon-box">
              <HublyClipboardIcon size={18} />
            </span>
            <span>Tareas</span>
            <span className="hb-widget-badge">{tasksBreakdown.pendingCount}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterByBrand((prev) => !prev)}
              title="Alternar entre tareas de la marca activa y todas las marcas"
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                border: "1px solid var(--ui-border)",
                background: filterByBrand ? "var(--ui-surface-2)" : "var(--ui-sky-soft)",
                color: filterByBrand ? "var(--ui-text-4)" : "var(--ui-accent-text)",
                cursor: "pointer",
              }}
            >
              {filterByBrand
                ? `${activeBrand?.name || "Mi marca"} (${tasksBreakdown.pendingCount})`
                : `Todas (${allBrandsTasksBreakdown.pendingCount})`}
            </button>
            <button
              type="button"
              onClick={() => setShowQuickTaskForm((prev) => !prev)}
              title="Añadir tarea rápida"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                color: "var(--ui-text-3)",
                cursor: "pointer",
              }}
            >
              <Plus className="w-3 h-3" />
              <span>Nueva</span>
            </button>
          </div>
        </div>

        {showQuickTaskForm && (
          <form
            onSubmit={handleCreateQuickTask}
            style={{
              padding: "12px 20px",
              background: "var(--ui-surface-2)",
              borderBottom: "1px solid var(--ui-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Escribe una tarea pendiente para el equipo..."
              aria-label="Título de nueva tarea"
              style={{
                width: "100%",
                padding: "7px 11px",
                fontSize: 12.5,
                borderRadius: 8,
                border: "1px solid var(--ui-border-strong)",
                background: "var(--ui-surface)",
                color: "var(--ui-text)",
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <select
                  value={newTaskBucket}
                  onChange={(e) => setNewTaskBucket(e.target.value as TaskDueBucket)}
                  aria-label="Cuándo vence"
                  style={{
                    fontSize: 11.5,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    color: "var(--ui-text-2)",
                  }}
                >
                  <option value="today">Para hoy</option>
                  <option value="tomorrow">Para mañana</option>
                  <option value="upcoming">Próximas</option>
                  <option value="overdue">Atrasada</option>
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  aria-label="Prioridad"
                  style={{
                    fontSize: 11.5,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    color: "var(--ui-text-2)",
                  }}
                >
                  <option value="Alta">Prioridad Alta</option>
                  <option value="Media">Prioridad Media</option>
                  <option value="Baja">Prioridad Baja</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowQuickTaskForm(false)}
                  style={{
                    fontSize: 11.5,
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface)",
                    color: "var(--ui-text-4)",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--hb-accent)",
                    color: "var(--on-accent)",
                    cursor: "pointer",
                  }}
                >
                  Guardar tarea
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="hb-widget-body hb-widget-body--tall" style={{ padding: "16px 20px" }}>
          {visibleGroups.length === 0 ? (
            <div className="hb-widget-empty" style={{ flex: 1 }}>
              <div className="hb-empty-illus">
                <HublyCheckCircleIcon size={26} />
              </div>
              <div className="hb-empty-title">
                Todo al día en {filterByBrand ? activeBrand?.name || "esta marca" : "tu agencia"}
              </div>
              <p className="hb-empty-desc">No tienes tareas pendientes en este filtro.</p>
            </div>
          ) : (
            visibleGroups.map((group, groupIdx) => (
              <div
                key={group.bucket}
                style={{ marginBottom: groupIdx < visibleGroups.length - 1 ? 14 : 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: group.bucket === "overdue" ? STATUS_META.changes.color : "var(--ui-text-4)",
                    marginBottom: 8,
                  }}
                >
                  <span>{group.label}</span>
                  {group.tasks.length > 1 && <span>{group.tasks.length}</span>}
                </div>

                <div className="hubly-task-group" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {group.tasks.map((task) => {
                    const taskBrand = brands.find((b) => b.id === task.brandId);
                    const isDone =
                      Boolean(task.completed) ||
                      task.status === "completada" ||
                      task.status === "done";
                    return (
                      <div
                        key={task.id}
                        className="hubly-task-row"
                        onClick={() => toggleTaskStatus(task.id)}
                        role="checkbox"
                        aria-checked={isDone}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleTaskStatus(task.id);
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                          <span className="hubly-check" data-done={isDone}>
                            {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          <span className="hubly-task-title">{task.title}</span>
                        </div>

                        {!filterByBrand && taskBrand && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: "var(--ui-muted)",
                              color: "var(--ui-text-3)",
                              flexShrink: 0,
                            }}
                          >
                            {taskBrand.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {tasksBreakdown.completedCount > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px dashed var(--ui-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setShowCompletedTasks((prev) => !prev)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--ui-text-4)",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>
                  {showCompletedTasks ? "Ocultar" : "Ver"} completadas (
                  {tasksBreakdown.completedCount})
                </span>
              </button>

              {showCompletedTasks && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {tasksBreakdown.completedTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "4px 6px",
                        borderRadius: 6,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "var(--ui-positive-text)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--ui-text-4)",
                            textDecoration: "line-through",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        title="Eliminar tarea"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--ui-text-5)",
                          cursor: "pointer",
                          padding: 2,
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="hb-widget-footer">
            <Link href="/tareas" className="hb-widget-link">
              Mi espacio →
            </Link>
          </div>
        </div>
      </section>
    );
}
