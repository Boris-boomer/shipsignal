import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { AiSettings } from "@/lib/types";

/**
 * 批量翻译文本。一次请求翻译一整批，比逐条快。
 * 失败时原样返回，不阻塞 feed 流程。
 */
export async function translateBatch(
  texts: string[],
  settings: AiSettings
): Promise<string[]> {
  if (!settings.api_key || texts.length === 0) return texts;

  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `把下面每一条 GitHub 仓库信息翻译成简体中文。

要求：
- 保留技术名词不翻译（如 Tauri、React、Laravel、PHP、Python、TypeScript、Rust、SaaS、API）
- 保留数字和符号（如 ⭐ 7583 里的数字）
- 保留 topics 里的英文标签不翻译（如 accounting / invoicing）
- 每行对应输入的行号
- 只返回 JSON 数组，不要 markdown，不要解释

格式：["翻译1", "翻译2", ...]

输入：
${numbered}`;

  try {
    const base = settings.api_base.replace(/\/$/, "");
    const res = await tauriFetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.api_key}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      danger: {
        acceptInvalidCerts: true,
        acceptInvalidHostnames: true,
      },
    });

    if (!res.ok) {
      console.warn("[translate] HTTP", res.status);
      return texts;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    let jsonText = content.trim();
    const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonText = fence[1].trim();
    const bracket = jsonText.match(/\[[\s\S]*\]/);
    if (bracket) jsonText = bracket[0];

    const arr = JSON.parse(jsonText);
    if (!Array.isArray(arr)) return texts;

    return texts.map((t, i) =>
      typeof arr[i] === "string" ? arr[i] : t
    );
  } catch (e) {
    console.warn("[translate] threw", e);
    return texts;
  }
}