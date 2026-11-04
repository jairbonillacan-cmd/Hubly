"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { useActiveBrand } from "@/lib/use-active-brand";
import { selectTasksBreakdown } from "@/lib/domain-selectors";
import { buildQuickTaskInput } from "@/lib/domain/dashboard";
import type {
  AgencyTask,
  BrandWorkspace,
  TaskDueBucket,
  TaskPriority,
} from "@/lib/types";
import { HublyClipboardIcon } from "@/components/app/icons/HublyIcons";
import {
  HublyCheckCircleIcon,
  HublyCheckIcon as Check,
  HublyPlusIcon as Plus,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

type TaskGroup = ReturnType<typeof selectTasksBreakdown>["groups"][number];

function TaskGroupList({
  groups,
  brands,
  filterByBrand,
  onToggleTask,
}: {
  groups: TaskGroup[];
  brands: BrandWorkspace[];
  filterByBrand: boolean;
  onToggleTask: (id: string) => void;
}) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.bucket} className="hubly-dashboard-task-section">
          <div
            className={`hubly-dashboard-task-group-head ${
              group.bucket === "overdue" ? "is-overdue" : ""
            }`}
          >
            <span>{group.label}</span>
            {group.tasks.length > 1 && <span>{group.tasks.length}</span>}
          </div>

          <div className="hubly-task-group hubly-dashboard-task-list">
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
                  onClick={() => onToggleTask(task.id)}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleTask(task.id);
                    }
                  }}
                >
                  <div className="hubly-dashboard-task-main">
                    <span className="hubly-check" data-done={isDone}>
                      {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="hubly-task-title">{task.title}</span>
                  </div>

                  {!filterByBrand && taskBrand && (
                    <span className="hubly-dashboard-task-brand">{taskBrand.name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function CompletedTasksSection({
  tasks,
  count,
  open,
  onToggleOpen,
  onToggleTask,
  onDeleteTask,
}: {
  tasks: AgencyTask[];
  count: number;
  open: boolean;
  onToggleOpen: () => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}) {
  return (
    <div className="hubly-dashboard-completed-wrap">
      <button
        type="button"
        onClick={onToggleOpen}
        className="hubly-dashboard-completed-toggle"
      >
        <span>
          {open ? "Ocultar" : "Ver"} completadas ({count})
        </span>
      </button>

      {open && (
        <div className="hubly-dashboard-completed-list">
          {tasks.map((task) => (
            <div key={task.id} className="hubly-dashboard-completed-row">
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className="hubly-dashboard-completed-btn"
              >
                <span className="hubly-dashboard-completed-check">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span className="hubly-dashboard-completed-title">{task.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                title="Eliminar tarea"
                className="hubly-dashboard-completed-delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WidgetTareas({
  filterByBrand,
  onToggleFilterByBrand,
}: {
  filterByBrand: boolean;
  onToggleFilterByBrand: () => void;
}) {
  const brands = useHublyStore((s) => s.brands);
  const tasks = useHublyStore((s) => s.tasks);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const timezone = useHublyStore((s) => s.profile?.timezone);
  const profileName = useHublyStore((s) => s.profile?.name);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);
  const addTask = useHublyStore((s) => s.addTask);
  const deleteTask = useHublyStore((s) => s.deleteTask);
  const activeBrand = useActiveBrand();

  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false);
  const [showQuickTaskForm, setShowQuickTaskForm] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskBucket, setNewTaskBucket] = useState<TaskDueBucket>("today");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");

  const tasksBreakdown = useMemo(
    () => selectTasksBreakdown(tasks, activeBrandId, filterByBrand, fixedIsoNow, timezone),
    [tasks, activeBrandId, filterByBrand, fixedIsoNow, timezone]
  );
  const allBrandsTasksBreakdown = useMemo(
    () => selectTasksBreakdown(tasks, activeBrandId, false, fixedIsoNow, timezone),
    [tasks, activeBrandId, fixedIsoNow, timezone]
  );

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    const input = buildQuickTaskInput({
      title: newTaskTitle,
      dueBucket: newTaskBucket,
      priority: newTaskPriority,
      brandId: activeBrand?.id ?? "",
      assignee: profileName,
      todayIso: tasksBreakdown.todayIso,
      tomorrowIso: tasksBreakdown.tomorrowIso,
    });
    if (!input) return;
    addTask(input);
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
      <div className="hb-widget-head hubly-dashboard-head-wrap">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyClipboardIcon size={18} />
          </span>
          <span>Tareas</span>
          <span className="hb-widget-badge">{tasksBreakdown.pendingCount}</span>
        </div>

        <div className="hubly-dashboard-task-controls">
          <button
            type="button"
            onClick={onToggleFilterByBrand}
            title="Alternar entre tareas de la marca activa y todas las marcas"
            className={`hubly-dashboard-filter-pill ${filterByBrand ? "" : "is-all"}`}
          >
            {filterByBrand
              ? `${activeBrand?.name || "Mi marca"} (${tasksBreakdown.pendingCount})`
              : `Todas (${allBrandsTasksBreakdown.pendingCount})`}
          </button>
          <button
            type="button"
            onClick={() => setShowQuickTaskForm((prev) => !prev)}
            title="Añadir tarea rápida"
            className="hubly-dashboard-chip-btn is-compact"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      {showQuickTaskForm && (
        <form onSubmit={handleCreateQuickTask} className="hubly-dashboard-quick-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Escribe una tarea pendiente para el equipo..."
            aria-label="Título de nueva tarea"
            className="hubly-dashboard-quick-input"
          />
          <div className="hubly-dashboard-quick-bar">
            <div className="hubly-dashboard-quick-selects">
              <select
                value={newTaskBucket}
                onChange={(e) => setNewTaskBucket(e.target.value as TaskDueBucket)}
                aria-label="Cuándo vence"
                className="hubly-dashboard-quick-select"
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
                className="hubly-dashboard-quick-select"
              >
                <option value="Alta">Prioridad Alta</option>
                <option value="Media">Prioridad Media</option>
                <option value="Baja">Prioridad Baja</option>
              </select>
            </div>
            <div className="hubly-dashboard-quick-actions">
              <button
                type="button"
                onClick={() => setShowQuickTaskForm(false)}
                className="hubly-dashboard-quick-cancel"
              >
                Cancelar
              </button>
              <button type="submit" className="hubly-dashboard-quick-submit">
                Guardar tarea
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="hb-widget-body hb-widget-body--tall hubly-dashboard-body-pad">
        {visibleGroups.length === 0 ? (
          <div className="hb-widget-empty hubly-dashboard-empty-grow">
            <div className="hb-empty-illus">
              <HublyCheckCircleIcon size={26} />
            </div>
            <div className="hb-empty-title">
              Todo al día en {filterByBrand ? activeBrand?.name || "esta marca" : "tu agencia"}
            </div>
            <p className="hb-empty-desc">No tienes tareas pendientes en este filtro.</p>
          </div>
        ) : (
          <TaskGroupList
            groups={visibleGroups}
            brands={brands}
            filterByBrand={filterByBrand}
            onToggleTask={toggleTaskStatus}
          />
        )}

        {tasksBreakdown.completedCount > 0 && (
          <CompletedTasksSection
            tasks={tasksBreakdown.completedTasks}
            count={tasksBreakdown.completedCount}
            open={showCompletedTasks}
            onToggleOpen={() => setShowCompletedTasks((prev) => !prev)}
            onToggleTask={toggleTaskStatus}
            onDeleteTask={deleteTask}
          />
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
