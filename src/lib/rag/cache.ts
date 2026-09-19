import { embedTexts } from "./embed";
import { getEmbedder } from "@/lib/embedding";

interface CacheEntry {
  embedderName: string;
  vector: number[];
}

const store = new Map<string, CacheEntry>();

export function getCached(id: string, embedderName: string): number[] | null {
  const hit = store.get(id);
  if (hit && hit.embedderName === embedderName) return hit.vector;
  return null;
}

export function setCached(
  id: string,
  embedderName: string,
  vector: number[]
): void {
  store.set(id, { embedderName, vector });
}

export function clearCache(): void {
  store.clear();
}

export function cacheSize(): number {
  return store.size;
}

export async function embedWithCache(
  items: { id: string; text: string }[]
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  const embedder = await getEmbedder();
  if (!embedder) return out;

  const toCompute: { id: string; text: string }[] = [];
  for (const item of items) {
    const cached = getCached(item.id, embedder.name);
    if (cached) {
      out.set(item.id, cached);
    } else {
      toCompute.push(item);
    }
  }

  if (toCompute.length > 0) {
    const vectors = await embedTexts(toCompute.map((i) => i.text));
    for (let i = 0; i < toCompute.length; i++) {
      const id = toCompute[i].id;
      const vec = vectors[i];
      setCached(id, embedder.name, vec);
      out.set(id, vec);
    }
  }

  return out;
}