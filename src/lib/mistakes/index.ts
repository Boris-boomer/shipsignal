import rawText from "./catalog.json";
import { rules } from "./catalog";
import type { Mistake, MistakeHit, ProjectDataLite } from "./types";

export type { Mistake, ProjectDataLite } from "./types";

interface CatalogEntry {
  title: string;
  reason: string;
}

const catalog = rawText as Record<string, CatalogEntry>;

function interpolate(
  tpl: string,
  vars: Record<string, string | number>
): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : ""
  );
}

function toMistake(hit: MistakeHit): Mistake {
  const entry = catalog[hit.id];
  if (!entry) {
    return {
      id: hit.id,
      title: hit.id,
      reason: "",
      severity: hit.severity,
    };
  }
  return {
    id: hit.id,
    title: interpolate(entry.title, hit.vars),
    reason: interpolate(entry.reason, hit.vars),
    severity: hit.severity,
  };
}

export function detectMistakes(data: ProjectDataLite): Mistake[] {
  const out: Mistake[] = [];
  for (const rule of rules) {
    const hit = rule.detect(data);
    if (hit) out.push(toMistake(hit));
  }
  return out;
}

export function topMistake(data: ProjectDataLite): Mistake | null {
  const all = detectMistakes(data);
  if (all.length === 0) return null;
  return all.find((m) => m.severity === "warn") ?? all[0];
}