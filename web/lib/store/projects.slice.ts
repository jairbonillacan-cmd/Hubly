import type { StateCreator } from "zustand";
import { moveInList } from "../use-kanban-drag";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { BrandProject } from "../types";

export interface ProjectsSlice {
  addProject: (project: Omit<BrandProject, "id">) => void;
  moveProject: (projectId: string, status: BrandProject["status"], beforeId: string | null) => void;
  updateProject: (projectId: string, patch: Partial<Omit<BrandProject, "id" | "brandId">>) => void;
  deleteProject: (projectId: string) => void;
}

export const createProjectsSlice: StateCreator<HublyStoreState, [], [], ProjectsSlice> = (set, get) => ({
  addProject: (projInput) => {
    set((s) => ({
      projects: [{ ...projInput, id: `proj-${Date.now()}` }, ...s.projects],
    }));
    persistWorkspaceState(get());
  },

  updateProject: (projectId, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)) }));
    persistWorkspaceState(get());
  },

  deleteProject: (projectId) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
    persistWorkspaceState(get());
  },

  moveProject: (projectId, status, beforeId) => {
    set((s) => ({
      projects: moveInList(s.projects, projectId, beforeId, (p) => ({ ...p, status })),
    }));
    persistWorkspaceState(get());
  },
});
