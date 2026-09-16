import { create } from "zustand";
import type { Lesson, LessonType } from "@/lib/types";
import {
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/db";

interface LessonState {
  lessons: Lesson[];
  loading: boolean;
  load: (projectId: string) => Promise<void>;
  add: (input: {
    project_id: string;
    lesson_type: LessonType;
    description: string;
    applicable_to?: string[];
  }) => Promise<Lesson>;
  update: (
    id: string,
    projectId: string,
    input: {
      lesson_type: LessonType;
      description: string;
      applicable_to?: string[];
    }
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lessons: [],
  loading: false,

  async load(projectId) {
    set({ loading: true });
    try {
      const lessons = await listLessons(projectId);
      set({ lessons });
    } finally {
      set({ loading: false });
    }
  },

  async add(input) {
    const l = await createLesson(input);
    set({ lessons: [l, ...get().lessons] });
    return l;
  },

  async update(id, projectId, input) {
    await updateLesson(id, input);
    const refreshed = await listLessons(projectId);
    set({ lessons: refreshed });
  },

  async remove(id) {
    await deleteLesson(id);
    set({ lessons: get().lessons.filter((l) => l.id !== id) });
  },
}));