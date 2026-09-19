import { listSignals, getActionCard } from "@/lib/db";
import type { Signal } from "@/lib/types";

export interface TracedSource {
  signal: Signal;
  snippet: string;
}

export async function traceActionCard(
  cardId: string
): Promise<TracedSource[]> {
  const card = await getActionCard(cardId);
  if (!card) return [];

  let ids: string[] = [];
  try {
    ids = JSON.parse(card.source_signals || "[]");
  } catch {
    return [];
  }
  if (ids.length === 0) return [];

  const all = await listSignals(card.project_id);
  const map = new Map(all.map((s) => [s.id, s]));
  const out: TracedSource[] = [];

  for (const id of ids) {
    const s = map.get(id);
    if (!s) continue;
    let snippet = s.signal_type;
    try {
      const d = JSON.parse(s.data);
      snippet = d.note ?? d.value ?? s.signal_type;
    } catch {
      // keep default
    }
    out.push({ signal: s, snippet: String(snippet).slice(0, 80) });
  }
  return out;
}