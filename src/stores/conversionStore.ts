import { create } from "zustand";
import type { Conversion } from "@/lib/types";
import { listConversions, createConversion } from "@/lib/db";

interface ConversionState {
  conversions: Conversion[];
  loading: boolean;
  load: (projectId: string) => Promise<void>;
  add: (input: Omit<Conversion, "id" | "created_at">) => Promise<Conversion>;
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
}));