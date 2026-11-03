// Tareas, listas y libretas.
import type { StoreApi } from "zustand";
import { moveInList } from "../use-kanban-drag";
import type { AgencyTask, NotebookItem } from "../types";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState, createActivityItem } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createTasksSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "addTask"
  | "updateTask"
  | "toggleTaskStatus"
  | "deleteTask"
  | "moveTask"
  | "addTaskList"
  | "renameTaskList"
  | "deleteTaskList"
  | "addNotebook"
  | "updateNotebook"
  | "deleteNotebook"
  | "toggleNotebookPinned"
> => ({
  addTask: (taskInput) => {
    set((s) => {
      const id = `task-${Date.now()}`;
      const brand = s.brands.find((b) => b.id === taskInput.brandId);
      const assigneeName =
        taskInput.assigneeName || taskInput.assignee || s.profile.name || "Jair";
      const assigneeInitial =
        taskInput.assigneeInitial || assigneeName.slice(0, 1).toUpperCase() || "J";
      const matchedMember = s.team.find(
        (m) => m.name.toLowerCase() === assigneeName.toLowerCase()
      );
      const assigneeId = taskInput.assigneeId || matchedMember?.id || "tm-1";
      const completed =
        taskInput.completed ??
        (taskInput.status === "done" || taskInput.status === "completada");
      const tags =
        taskInput.tags && taskInput.tags.length > 0
          ? taskInput.tags
          : [brand?.name || "Agencia", taskInput.listName || "Primeros pasos"];

      const createdTask: AgencyTask = {
        ...taskInput,
        id,
        completed,
        assigneeId,
        assignee: assigneeName,
        assigneeName,
        assigneeInitial,
        tags,
        dueBucket: taskInput.dueBucket || "today",
      };

      const event = createActivityItem(s, {
        type: "task_started",
        memberId: assigneeId,
        brandId: taskInput.brandId,
        durationMinutes: 15,
        metadata: { taskId: id, title: taskInput.title },
      });

      return {
        tasks: [createdTask, ...s.tasks],
        onboarding: {
          ...s.onboarding,
          taskCreatedOrCompleted: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  updateTask: (taskId, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus =
          patch.status ??
          (patch.completed !== undefined ? (patch.completed ? "done" : "todo") : t.status);
        const nextCompleted =
          patch.completed !== undefined
            ? patch.completed
            : nextStatus === "done" || nextStatus === "completada";
        return {
          ...t,
          ...patch,
          status: nextStatus,
          completed: nextCompleted,
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  toggleTaskStatus: (taskId) => {
    set((s) => {
      let toggledTask: AgencyTask | undefined;
      let becameDone = false;
      const nowIso = s.testClock?.fixedIsoNow || new Date().toISOString();

      const nextTasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        toggledTask = t;
        const isCurrentlyDone =
          t.status === "done" || t.status === "completada" || t.completed;
        becameDone = !isCurrentlyDone;
        const nextStatus: AgencyTask["status"] = becameDone ? "done" : "todo";
        return {
          ...t,
          status: nextStatus,
          completed: becameDone,
          completedAt: becameDone ? nowIso : undefined,
          dueLabel: becameDone
            ? "Completada"
            : t.dueLabel === "Completada"
            ? "Hoy"
            : t.dueLabel,
        };
      });

      if (!toggledTask) return s;

      const event = createActivityItem(s, {
        type: becameDone ? "task_completed" : "task_started",
        memberId: toggledTask.assigneeId || "tm-1",
        brandId: toggledTask.brandId,
        durationMinutes: becameDone ? 20 : 5,
        metadata: { taskId: toggledTask.id, title: toggledTask.title },
      });

      return {
        tasks: nextTasks,
        onboarding: {
          ...s.onboarding,
          taskCreatedOrCompleted: becameDone ? true : s.onboarding.taskCreatedOrCompleted,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },

  deleteTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
    }));
    persistWorkspaceState(get());
  },

  moveTask: (taskId, status, beforeId) => {
    set((s) => ({
      tasks: moveInList(s.tasks, taskId, beforeId, (t) => ({
        ...t,
        status,
        completed: status === "done",
        completedAt: status === "done" ? new Date().toISOString() : undefined,
      })),
    }));
    persistWorkspaceState(get());
  },

  addTaskList: (brandId, name) => {
    set((s) => ({
      taskLists: [...(s.taskLists || []), { id: `list-${Date.now()}`, brandId, name }],
    }));
    persistWorkspaceState(get());
  },

  renameTaskList: (brandId, oldName, newName) => {
    const inList = (x: { brandId: string }) => x.brandId === brandId;
    set((s) => {
      const known = (s.taskLists || []).some((l) => inList(l) && l.name === oldName);
      return {
        tasks: s.tasks.map((t) => (inList(t) && t.listName === oldName ? { ...t, listName: newName } : t)),
        taskLists: known
          ? (s.taskLists || []).map((l) => (inList(l) && l.name === oldName ? { ...l, name: newName } : l))
          : [...(s.taskLists || []), { id: `list-${Date.now()}`, brandId, name: newName }],
      };
    });
    persistWorkspaceState(get());
  },

  deleteTaskList: (brandId, name) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => !(t.brandId === brandId && t.listName === name)),
      taskLists: (s.taskLists || []).filter((l) => !(l.brandId === brandId && l.name === name)),
    }));
    persistWorkspaceState(get());
  },

  addNotebook: (input) => {
    const nowIso = new Date().toISOString();
    const count = get().notebooks.length + 1;
    const stampLabel = `N° ${String(count).padStart(2, "0")} · OCT 26`;
    const created: NotebookItem = {
      id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      brandId: input.brandId || get().activeBrandId || "brand-min",
      title: (input.title.trim() || "NUEVA LIBRETA").toUpperCase(),
      subtitle: input.subtitle || stampLabel,
      stamp: stampLabel,
      variant: "space",
      category: input.category || "Notas de marca",
      content: input.content ?? "",
      bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
      accentColor: input.accentColor || "#10B981",
      updatedAt: nowIso,
      updatedBy: get().profile.name || "Jair",
      isPinned: input.isPinned ?? false,
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "notebook_updated",
        brandId: created.brandId,
        durationMinutes: 10,
        metadata: { notebookId: created.id, title: created.title },
      });
      return {
        notebooks: [created, ...s.notebooks],
        activeNotebookId: created.id,
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
    return created;
  },

  updateNotebook: (notebookId, patch) => {
    const nowIso = new Date().toISOString();
    set((s) => ({
      notebooks: s.notebooks.map((nb) =>
        nb.id === notebookId
          ? {
              ...nb,
              ...patch,
              updatedAt: nowIso,
            }
          : nb
      ),
    }));
    persistWorkspaceState(get());
  },

  deleteNotebook: (notebookId) => {
    set((s) => {
      const remaining = s.notebooks.filter((nb) => nb.id !== notebookId);
      return {
        notebooks: remaining,
        activeNotebookId:
          s.activeNotebookId === notebookId ? remaining[0]?.id ?? null : s.activeNotebookId,
      };
    });
    persistWorkspaceState(get());
  },

  toggleNotebookPinned: (notebookId) => {
    set((s) => ({
      notebooks: s.notebooks.map((nb) =>
        nb.id === notebookId
          ? { ...nb, isPinned: !nb.isPinned, updatedAt: new Date().toISOString() }
          : nb
      ),
    }));
    persistWorkspaceState(get());
  },
});
