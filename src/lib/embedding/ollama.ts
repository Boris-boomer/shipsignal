import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { Embedder } from "./types";

const DANGER = {
  acceptInvalidCerts: true,
  acceptInvalidHostnames: true,
};

function stripV1(base: string): string {
  return base.replace(/\/$/, "").replace(/\/v1$/, "");
}

let tagsCache: { root: string; names: string[]; at: number } | null = null;
const TAGS_TTL = 30_000;

async function fetchOllamaModelNames(root: string): Promise<string[]> {
  const now = Date.now();
  if (
    tagsCache &&
    tagsCache.root === root &&
    now - tagsCache.at < TAGS_TTL
  ) {
    return tagsCache.names;
  }
  try {
    const r = await tauriFetch(`${root}/api/tags`, { danger: DANGER });
    if (!r.ok) return [];
    const data = await r.json();
    const models: any[] = data?.models ?? [];
    const names = models.map((m) => String(m.name ?? ""));
    tagsCache = { root, names, at: now };
    return names;
  } catch {
    return [];
  }
}

export function createOllamaEmbedder(
  base: string,
  model: string
): Embedder {
  const root = stripV1(base);
  const url = `${root}/api/embeddings`;

  return {
    name: `ollama:${model}`,

    async isReady() {
      const names = await fetchOllamaModelNames(root);
      return names.some((n) => n.startsWith(model));
    },

    async embed(texts) {
      const out: number[][] = [];
      for (const text of texts) {
        const r = await tauriFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: text }),
          danger: DANGER,
        });
        if (!r.ok) throw new Error(`ollama ${r.status}`);
        const data = await r.json();
        if (!Array.isArray(data?.embedding)) {
          throw new Error("ollama returned no embedding");
        }
        out.push(data.embedding);
      }
      return out;
    },
  };
}

export async function listOllamaModels(
  base: string
): Promise<{ name: string; size: number }[]> {
  const root = stripV1(base);
  try {
    const r = await tauriFetch(`${root}/api/tags`, { danger: DANGER });
    if (!r.ok) return [];
    const data = await r.json();
    const models: any[] = data?.models ?? [];
    return models.map((m) => ({
      name: String(m.name ?? ""),
      size: Number(m.size ?? 0),
    }));
  } catch {
    return [];
  }
}