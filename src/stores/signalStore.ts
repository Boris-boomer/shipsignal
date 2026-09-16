import { create } from "zustand";
import type { Confidence, Signal, SignalInput } from "@/lib/types";
import {
  listSignals,
  createSignal,
  updateSignal,
  deleteSignal,
  overrideSignalConfidence,
} from "@/lib/db";

interface SignalState {
  signals: Signal[];
  loading: boolean;
  load: (projectId: string) => Promise<void>;
  add: (input: SignalInput) => Promise<Signal>;
  update: (id: string, input: SignalInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  override: (
    id: string,
    confidence: Confidence | "ignored",
    reason: string,
    impact: string
  ) => Promise<void>;
}

export const useSignalStore = create<SignalState>((set, get) => ({
  signals: [],
  loading: false,

  async load(projectId) {
    set({ loading: true });
    try {
      const signals = await listSignals(projectId);
      set({ signals });
    } finally {
      set({ loading: false });
    }
  },

  async add(input) {
    const s = await createSignal(input);
    set({ signals: [s, ...get().signals] });
    return s;
  },

  async update(id, input) {
    await updateSignal(id, input);
    const refreshed = await listSignals(input.project_id);
    set({ signals: refreshed });
  },

  async remove(id) {
    await deleteSignal(id);
    set({ signals: get().signals.filter((s) => s.id !== id) });
  },

  async override(id, confidence, reason, impact) {
    await overrideSignalConfidence(id, confidence, reason, impact);
    const signals = get().signals.map((s) =>
      s.id === id
        ? {
            ...s,
            developer_confidence: confidence,
            override_reason: reason,
            decision_impact: impact,
          }
        : s
    );
    set({ signals });
  },
}));