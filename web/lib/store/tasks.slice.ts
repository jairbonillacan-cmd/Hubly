import type { StateCreator } from "zustand";
import { createActivityItem } from "../domain/activity";
import { buildTask, mergeTaskPatch, toggleTaskState, type AddTaskInput } from "../domain/tasks";
import { moveInList } from "../use-kanban-drag";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { AgencyTask } from "../types";


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
      const createdTask = buildTask(taskInput, {
        id: `task-${Date.now()}`,
        brands: s.brands,
        team: s.team,
        profileName: s.profile.name,
      });

      const event = createActivityItem(s, {
        type: "task_started",
        memberId: createdTask.assigneeId,
        brandId: taskInput.brandId,
        durationMinutes: 15,
        metadata: { taskId: createdTask.id, title: createdTask.title },
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
      tasks: s.tasks.map((t) => (t.id === taskId ? mergeTaskPatch(t, patch) : t)),
    }));
    persistWorkspaceState(get());
  },

  toggleTaskStatus: (taskId) => {
    set((s) => {
      const nowIso = s.testClock?.fixedIsoNow || new Date().toISOString();
      const current = s.tasks.find((t) => t.id === taskId);
      if (!current) return s;

      const { task: toggledTask, becameDone } = toggleTaskState(current, nowIso);
      const event = createActivityItem(s, {
        type: becameDone ? "task_completed" : "task_started",
        memberId: toggledTask.assigneeId || "tm-1",
        brandId: toggledTask.brandId,
        durationMinutes: becameDone ? 20 : 5,
        metadata: { taskId: toggledTask.id, title: toggledTask.title },
      });

      return {
        tasks: s.tasks.map((t) => (t.id === taskId ? toggledTask : t)),
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
