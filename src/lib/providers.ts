export interface AiProvider {
  id: string;
  nameKey: string;
  api_base: string;
  default_model: string;
  hintKey: string;
}

export const CUSTOM_PROVIDER_ID = "custom";

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "openai",
    nameKey: "settings.provider.openai.name",
    api_base: "https://api.openai.com/v1",
    default_model: "gpt-4o-mini",
    hintKey: "settings.provider.openai.hint",
  },
  {
    id: "zhipu",
    nameKey: "settings.provider.zhipu.name",
    api_base: "https://open.bigmodel.cn/api/paas/v4",
    default_model: "glm-4-flash-250414",
    hintKey: "settings.provider.zhipu.hint",
  },
  {
    id: "deepseek",
    nameKey: "settings.provider.deepseek.name",
    api_base: "https://api.deepseek.com/v1",
    default_model: "deepseek-chat",
    hintKey: "settings.provider.deepseek.hint",
  },
  {
    id: "moonshot",
    nameKey: "settings.provider.moonshot.name",
    api_base: "https://api.moonshot.cn/v1",
    default_model: "moonshot-v1-8k",
    hintKey: "settings.provider.moonshot.hint",
  },
  {
    id: "dashscope",
    nameKey: "settings.provider.dashscope.name",
    api_base: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    default_model: "qwen-plus",
    hintKey: "settings.provider.dashscope.hint",
  },
  {
    id: "ollama",
    nameKey: "settings.provider.ollama.name",
    api_base: "http://localhost:11434/v1",
    default_model: "qwen3:8b",
    hintKey: "settings.provider.ollama.hint",
  },
  {
    id: CUSTOM_PROVIDER_ID,
    nameKey: "settings.provider.custom.name",
    api_base: "",
    default_model: "",
    hintKey: "settings.provider.custom.hint",
  },
];

export function getProvider(id: string): AiProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

/**
 * 根据当前 api_base 反查是哪个预设提供商。
 * 匹配不到（或为空）返回 CUSTOM_PROVIDER_ID。
 * 比较时会去掉末尾斜杠。
 */
export function detectProviderId(apiBase: string): string {
  const norm = apiBase.trim().replace(/\/+$/, "");
  if (!norm) return CUSTOM_PROVIDER_ID;
  for (const p of AI_PROVIDERS) {
    if (p.id === CUSTOM_PROVIDER_ID) continue;
    if (p.api_base.replace(/\/+$/, "") === norm) return p.id;
  }
  return CUSTOM_PROVIDER_ID;
}