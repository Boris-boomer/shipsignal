import { create } from "zustand";
import type { Project, ProjectCreateInput } from "@/lib/types";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  getProject,
} from "@/lib/db";

interface ProjectState {
  projects: Project[];
  current: Project | null;
  loading: boolean;
  loadAll: () => Promise<void>;
  loadOne: (id: string) => Promise<void>;
  create: (input: ProjectCreateInput) => Promise<Project>;
  update: (id: string, patch: Partial<Project>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setCurrent: (p: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  current: null,
  loading: false,

  async loadAll() {
    set({ loading: true });
    try {
      const projects = await listProjects();
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },

  async loadOne(id) {
    const p = await getProject(id);
    set({ current: p });
  },

  async create(input) {
    const p = await createProject(input);
    set({ projects: [p, ...get().projects] });
    return p;
  },

  async update(id, patch) {
    await updateProject(id, patch);
    const projects = await listProjects();
    set({ projects });
    if (get().current?.id === id) {
      set({ current: await getProject(id) });
    }
  },

  async remove(id) {
    await deleteProject(id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
    if (get().current?.id === id) set({ current: null });
  },

  setCurrent(p) {
    set({ current: p });
  },
}));