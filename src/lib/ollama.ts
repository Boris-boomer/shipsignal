import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

/**
 * 从 Ollama 拉本地已有模型列表。
 * base 形如 http://localhost:11434（不带 /v1）。
 */
export async function listOllamaModels(
  base: string
): Promise<OllamaModel[]> {
  const url = `${base.replace(/\/$/, "").replace(/\/v1$/, "")}/api/tags`;
  try {
    const r = await tauriFetch(url, {
      danger: {
        acceptInvalidCerts: true,
        acceptInvalidHostnames: true,
      },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const models: any[] = data?.models ?? [];
    return models.map((m) => ({
      name: String(m.name ?? ""),
      size: Number(m.size ?? 0),
      modified_at: String(m.modified_at ?? ""),
    }));
  } catch {
    return [];
  }
}