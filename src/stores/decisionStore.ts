import { create } from "zustand";
import type { Confidence, DecisionLog, DecisionOutcome } from "@/lib/types";
import {
  listDecisions,
  createDecision,
  updateDecision,
  deleteDecision,
  reviewDecision,
} from "@/lib/db";

interface DecisionState {
  decisions: DecisionLog[];
  loading: boolean;
  load: (projectId: string) => Promise<void>;
  add: (input: {
    project_id: string;
    signal_id?: string | null;
    decision: string;
    basis?: string | null;
    confidence?: Confidence | null;
  }) => Promise<DecisionLog>;
  update: (
    id: string,
    projectId: string,
    input: {
      decision: string;
      basis?: string | null;
      confidence?: Confidence | null;
    }
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  review: (id: string, outcome: DecisionOutcome) => Promise<void>;
}

export const useDecisionStore = create<DecisionState>((set, get) => ({
  decisions: [],
  loading: false,

  async load(projectId) {
    set({ loading: true });
    try {
      const decisions = await listDecisions(projectId);
      set({ decisions });
    } finally {
      set({ loading: false });
    }
  },

  async add(input) {
    const d = await createDecision(input);
    set({ decisions: [d, ...get().decisions] });
    return d;
  },

  async update(id, projectId, input) {
    await updateDecision(id, input);
    const refreshed = await listDecisions(projectId);
    set({ decisions: refreshed });
  },

  async remove(id) {
    await deleteDecision(id);
    set({ decisions: get().decisions.filter((d) => d.id !== id) });
  },

  async review(id, outcome) {
    await reviewDecision(id, outcome);
    set({
      decisions: get().decisions.map((d) =>
        d.id === id
          ? { ...d, outcome, reviewed_at: new Date().toISOString() }
          : d
      ),
    });
  },
}));