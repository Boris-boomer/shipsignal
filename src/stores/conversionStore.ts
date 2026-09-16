import { create } from "zustand";
import type { Conversion } from "@/lib/types";
import {
  listConversions,
  createConversion,
  updateConversion,
  deleteConversion,
} from "@/lib/db";

interface ConversionState {
  conversions: Conversion[];
  loading: boolean;
  load: (projectId: string) => Promise<void>;
  add: (input: Omit<Conversion, "id" | "created_at">) => Promise<Conversion>;
  update: (
    id: string,
    projectId: string,
    input: {
      user_segment: string | null;
      monetization_form: string | null;
      amount: number | null;
      currency: string;
      recurring: number;
      notes: string | null;
    }
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useConversionStore = create<ConversionState>((set, get) => ({
  conversions: [],
  loading: false,

  async load(projectId) {
    set({ loading: true });
    try {
      const conversions = await listConversions(projectId);
      set({ conversions });
    } finally {
      set({ loading: false });
    }
  },

  async add(input) {
    const c = await createConversion(input);
    set({ conversions: [c, ...get().conversions] });
    return c;
  },

  async update(id, projectId, input) {
    await updateConversion(id, input);
    const refreshed = await listConversions(projectId);
    set({ conversions: refreshed });
  },

  async remove(id) {
    await deleteConversion(id);
    set({ conversions: get().conversions.filter((c) => c.id !== id) });
  },
}));