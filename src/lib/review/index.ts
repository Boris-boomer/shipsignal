import { listDecisions, listSignals, reviewDecision } from "@/lib/db";
import type { DecisionLog } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const REVIEW_AFTER_DAYS = 7;

export interface DueReview {
  decision: DecisionLog;
  daysAgo: number;
  newSignalCount: number;
}

export async function getDueReviews(
  projectId: string
): Promise<DueReview[]> {
  const decisions = await listDecisions(projectId);
  const signals = await listSignals(projectId);
  const now = Date.now();
  const out: DueReview[] = [];

  for (const d of decisions) {
    if (d.outcome !== "pending") continue;
    const days = Math.floor((now - Date.parse(d.created_at)) / DAY);
    if (days < REVIEW_AFTER_DAYS) continue;

    const newSignals = signals.filter(
      (s) => Date.parse(s.created_at) > Date.parse(d.created_at)
    );

    out.push({
      decision: d,
      daysAgo: days,
      newSignalCount: newSignals.length,
    });
  }

  return out.sort((a, b) => b.daysAgo - a.daysAgo);
}

export async function resolveReview(
  decisionId: string,
  outcome: "confirmed" | "reversed"
): Promise<void> {
  await reviewDecision(decisionId, outcome);
}