import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { Embedder } from "./types";

const DANGER = {
  acceptInvalidCerts: true,
  acceptInvalidHostnames: true,
};

export function createOpenAIEmbedder(
  base: string,
  key: string,
  model: string
): Embedder {
  const url = `${base.replace(/\/$/, "")}/embeddings`;

  return {
    name: `openai:${model}`,

    async isReady() {
      return Boolean(key);
    },

    async embed(texts) {
      const r = await tauriFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, input: texts }),
        danger: DANGER,
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`embedding ${r.status}: ${t.slice(0, 120)}`);
      }
      const data = await r.json();
      const arr: any[] = data?.data ?? [];
      return arr.map((d) => d.embedding as number[]);
    },
  };
}