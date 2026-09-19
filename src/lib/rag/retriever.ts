import { listSignals, listDecisions } from "@/lib/db";
import { embedWithCache } from "./cache";
import { cosine, embedTexts } from "./embed";
import { getEmbedder } from "@/lib/embedding";
import type { RagHit } from "./types";

interface Doc {
  id: string;
  text: string;
  source: string;
  created_at: string;
}

function signalToText(s: {
  signal_type: string;
  source: string | null;
  data: string;
}): string {
  let note = "";
  try {
    const d = JSON.parse(s.data || "{}");
    note = d.note ?? d.value ?? "";
  } catch {
    // ignore
  }
  return `[${s.signal_type}] ${s.source ?? ""} ${note}`.trim();
}

export async function retrieveRelated(
  projectId: string,
  query: string,
  k = 3
): Promise<RagHit[]> {
  if (!query.trim()) return [];

  const embedder = await getEmbedder();
  if (!embedder) return [];
  const ready = await embedder.isReady();
  if (!ready) return [];

  const signals = await listSignals(projectId);
  const decisions = await listDecisions(projectId);

  const docs: Doc[] = [];
  for (const s of signals) {
    docs.push({
      id: `sig_${s.id}`,
      text: signalToText(s),
      source: s.source ?? "signal",
      created_at: s.created_at,
    });
  }
  for (const d of decisions) {
    docs.push({
      id: `dec_${d.id}`,
      text: `[决策] ${d.decision} ${d.basis ?? ""}`.trim(),
      source: "decision",
      created_at: d.created_at,
    });
  }

  if (docs.length === 0) return [];

  let docVectors: Map<string, number[]>;
  try {
    docVectors = await embedWithCache(
      docs.map((d) => ({ id: d.id, text: d.text }))
    );
  } catch (e) {
    console.warn("[rag] embed docs failed", e);
    return [];
  }

  let queryVec: number[];
  try {
    const [v] = await embedTexts([query]);
    queryVec = v;
  } catch (e) {
    console.warn("[rag] embed query failed", e);
    return [];
  }

  const scored: RagHit[] = [];
  for (const d of docs) {
    const v = docVectors.get(d.id);
    if (!v) continue;
    scored.push({
      id: d.id,
      text: d.text,
      score: cosine(queryVec, v),
      source: d.source,
      created_at: d.created_at,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((h) => h.score > 0.3).slice(0, k);
}