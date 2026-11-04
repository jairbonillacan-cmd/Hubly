import type { StateCreator } from "zustand";
import { createActivityItem } from "../domain/activity";
import { moveInList } from "../use-kanban-drag";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { AgencyTask } from "../types";

export type AddTaskInput = Omit<
  AgencyTask,
  | "id"
  | "completed"
  | "assigneeId"
  | "assigneeName"
  | "assigneeInitial"
  | "tags"
  | "dueBucket"
> & {
  completed?: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeInitial?: string;
  tags?: string[];
  dueBucket?: AgencyTask["dueBucket"];
};

export interface TasksSlice {
  addTask: (task: AddTaskInput) => void;
  updateTask: (taskId: string, patch: Partial<AgencyTask>) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, status: "todo" | "in_progress" | "done", beforeId: string | null) => void;
  addTaskList: (brandId: string, name: string) => void;
  renameTaskList: (brandId: string, oldName: string, newName: string) => void;
  deleteTaskList: (brandId: string, name: string) => void;
}

export const createTasksSlice: StateCreator<HublyStoreState, [], [], TasksSlice> = (set, get) => ({
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
});
