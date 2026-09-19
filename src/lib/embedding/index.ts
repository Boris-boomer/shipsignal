import { createOllamaEmbedder, listOllamaModels } from "./ollama";
import { createOpenAIEmbedder } from "./openai";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Embedder } from "./types";

export type { Embedder } from "./types";
export { listOllamaModels } from "./ollama";

function isOllama(base: string): boolean {
  return /localhost:11434|127\.0\.0\.1:11434/.test(base);
}

/**
 * 按优先级挑 Ollama 上的 embedding 模型。
 * 越靠前越优先。
 */
function pickOllamaEmbedModel(models: { name: string }[]): string | null {
  const names = models.map((m) => m.name);
  const priority: RegExp[] = [
    /^nomic-embed/i,
    /^bge-/i,
    /embedding/i,
    /embed/i,
  ];
  for (const re of priority) {
    const hit = names.find((n) => re.test(n));
    if (hit) return hit;
  }
  return null;
}

function guessCloudEmbedModel(base: string): string | null {
  if (base.includes("deepseek")) return "deepseek-embedding";
  if (base.includes("openai.com")) return "text-embedding-3-small";
  if (base.includes("bigmodel.cn")) return "embedding-3";
  if (base.includes("dashscope")) return "text-embedding-v3";
  return null;
}

/* ---------- Ollama 模型列表缓存 ---------- */

let ollamaModelsCache: {
  base: string;
  models: { name: string }[];
  at: number;
} | null = null;
const MODELS_CACHE_TTL = 30_000;

async function getOllamaModels(base: string) {
  const now = Date.now();
  if (
    ollamaModelsCache &&
    ollamaModelsCache.base === base &&
    now - ollamaModelsCache.at < MODELS_CACHE_TTL
  ) {
    return ollamaModelsCache.models;
  }
  const models = await listOllamaModels(base);
  ollamaModelsCache = { base, models, at: now };
  return models;
}

/* ---------- Embedder 缓存 ---------- */

let embedderCache: {
  key: string;
  embedder: Embedder | null;
  at: number;
} | null = null;
const EMBEDDER_CACHE_TTL = 30_000;

export async function getEmbedder(): Promise<Embedder | null> {
  const ai = useSettingsStore.getState().ai;
  if (!ai?.api_base) return null;

  const key = `${ai.api_base}::${ai.api_key ?? ""}`;
  const now = Date.now();
  if (
    embedderCache &&
    embedderCache.key === key &&
    now - embedderCache.at < EMBEDDER_CACHE_TTL
  ) {
    return embedderCache.embedder;
  }

  let embedder: Embedder | null = null;

  if (isOllama(ai.api_base)) {
    const models = await getOllamaModels(ai.api_base);
    const name = pickOllamaEmbedModel(models);
    if (name) {
      embedder = createOllamaEmbedder(ai.api_base, name);
    }
  } else {
    if (ai.api_key) {
      const model = guessCloudEmbedModel(ai.api_base);
      if (model) {
        embedder = createOpenAIEmbedder(ai.api_base, ai.api_key, model);
      }
    }
  }

  embedderCache = { key, embedder, at: now };
  return embedder;
}

/** 用户切换 AI 配置后调一下，清掉旧缓存 */
export function clearEmbedderCache(): void {
  embedderCache = null;
  ollamaModelsCache = null;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}