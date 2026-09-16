import { create } from "zustand";
import type { AiMessage, AiPurpose } from "@/lib/types";
import { streamChat } from "@/lib/ai";
import { createAiInteraction, getSetting, setSetting } from "@/lib/db";
import { buildProjectContext } from "@/lib/aiContext";
import { languageDirective } from "@/i18n";
import { useSettingsStore } from "./settingsStore";
import { useProjectStore } from "./projectStore";
import { uuid } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  streaming?: boolean;
  interrupted?: boolean;
  created_at: string;
}

interface AiState {
  messages: ChatMessage[];
  streaming: boolean;
  cancelling: boolean;
  error: string | null;
  purpose: AiPurpose;
  projectId: string | null;
  uiPrefsLoaded: boolean;
  loadUiPrefs: () => Promise<void>;
  setPurpose: (p: AiPurpose) => void;
  setProjectId: (id: string | null) => void;
  send: (text: string) => Promise<void>;
  continueGeneration: (messageId: string) => Promise<void>;
  cancel: () => void;
  clear: () => void;
}

const SYSTEM_PROMPTS: Record<AiPurpose, string> = {
  general:
    "你是 ShipSignal 的决策辅助助手。你的职责是帮助独立开发者梳理思路、总结模式、起草文案。你不判断数据真假，不改变任何可信度评分，不做自动归档。回答简洁、结构化、可操作。",
  signal_summary:
    "你是一个信号模式总结助手。用户会给你一批信号（用户反馈、付费行为、渠道数据等）。你的任务是归纳出模式、指出信号间的关联与矛盾，帮助开发者看清趋势。你不判断信号真假，不修改任何评分。",
  channel_summary:
    "你是一个渠道归纳助手。用户会给你渠道相关的信息。你的任务是归纳出有效的渠道特征、目标用户聚集地、发布节奏建议。回答结构化、具体可执行。",
  distribution_draft:
    "你是一个分发草稿助手。用户会给你产品信息和目标用户。你的任务是起草可发布的分发文案（推特、Reddit、Hacker News、Product Hunt 等平台风格），语气自然、不过度营销、有具体钩子。",
  lesson_summary:
    "你是一个学习总结助手。用户会给你一个项目的经历。你的任务是提炼可迁移的认知（哪些做法成立、哪些被推翻、哪些新发现），供未来项目复用。每条认知要具体、可操作。",
  structured_draft:
    "你是结构化信息起草助手。根据用户提供的项目上下文，输出符合字段定义的 JSON。只输出 JSON，不要任何解释。",
};

const CONTINUE_INSTRUCTION =
  "[继续] 请接着上一条回答继续写下去，不要重复已经写过的内容，直接从被截断处续写。";

const SETTINGS_KEY_PURPOSE = "ai_ui_purpose";
const SETTINGS_KEY_PROJECT_ID = "ai_ui_project_id";

let activeCancel: (() => Promise<void>) | null = null;

export const useAiStore = create<AiState>((set, get) => ({
  messages: [],
  streaming: false,
  cancelling: false,
  error: null,
  purpose: "general",
  projectId: null,
  uiPrefsLoaded: false,

  async loadUiPrefs() {
    if (get().uiPrefsLoaded) return;
    try {
      const [purposeRaw, projectIdRaw] = await Promise.all([
        getSetting(SETTINGS_KEY_PURPOSE),
        getSetting(SETTINGS_KEY_PROJECT_ID),
      ]);
      const purpose: AiPurpose =
        purposeRaw && purposeRaw in SYSTEM_PROMPTS
          ? (purposeRaw as AiPurpose)
          : "general";
      const projectId =
        projectIdRaw && projectIdRaw.trim() ? projectIdRaw : null;
      set({ purpose, projectId, uiPrefsLoaded: true });
    } catch (e) {
      console.error("[ai] loadUiPrefs failed", e);
      set({ uiPrefsLoaded: true });
    }
  },

  setPurpose(p) {
    set({ purpose: p });
    void setSetting(SETTINGS_KEY_PURPOSE, p).catch((e) =>
      console.error("[ai] persist purpose failed", e)
    );
  },

  setProjectId(id) {
    set({ projectId: id });
    void setSetting(SETTINGS_KEY_PROJECT_ID, id ?? "").catch((e) =>
      console.error("[ai] persist projectId failed", e)
    );
  },

  async send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (get().streaming) return;

    const settings = useSettingsStore.getState().ai;
    if (!settings.api_key.trim()) {
      set({ error: "尚未配置 API Key，请前往「设置」填写。" });
      return;
    }

    const purpose = get().purpose;
    const projectId = get().projectId;

    const systemPrompt = await buildSystemPrompt(purpose, projectId);

    const userMsg: ChatMessage = {
      id: uuid(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    const assistantId = uuid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
      created_at: new Date().toISOString(),
    };

    set({
      messages: [...get().messages, userMsg, assistantMsg],
      streaming: true,
      cancelling: false,
      error: null,
    });

    const historyMessages: AiMessage[] = [
      { role: "system", content: systemPrompt },
      ...get()
        .messages.filter((m) => m.id !== assistantId && m.role !== "error")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];

    let buffered = "";
    let wasCancelled = false;

    const handle = streamChat(
      {
        messages: historyMessages,
        purpose,
        projectId,
        apiBase: settings.api_base,
        apiKey: settings.api_key,
        model: settings.model,
        temperature: settings.temperature,
      },
      {
        onDelta: (delta) => {
          buffered += delta;
          set({
            messages: get().messages.map((m) =>
              m.id === assistantId ? { ...m, content: buffered } : m
            ),
          });
        },
        onCancelled: () => {
          wasCancelled = true;
        },
      }
    );

    activeCancel = handle.cancel;

    try {
      const full = await handle.promise;
      set({
        messages: get().messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: full,
                streaming: false,
                interrupted: wasCancelled,
              }
            : m
        ),
        streaming: false,
        cancelling: false,
      });

      void createAiInteraction({
        project_id: projectId,
        purpose,
        prompt: trimmed,
        response: full,
        model: settings.model,
      }).catch((e) => console.error("[ai] persist failed", e));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const hadContent = buffered.length > 0;
      set({
        messages: get().messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: hadContent ? buffered : "（未收到响应）",
                streaming: false,
                role: hadContent ? "assistant" : "error",
                interrupted: false,
              }
            : m
        ),
        streaming: false,
        cancelling: false,
        error: message,
      });
    } finally {
      activeCancel = null;
      if (wasCancelled) set({ error: null });
    }
  },

  async continueGeneration(messageId) {
    const state = get();
    if (state.streaming) return;

    const target = state.messages.find((m) => m.id === messageId);
    if (!target || target.role !== "assistant") return;
    if (!target.interrupted) return;

    const settings = useSettingsStore.getState().ai;
    if (!settings.api_key.trim()) {
      set({ error: "尚未配置 API Key，请前往「设置」填写。" });
      return;
    }

    const purpose = state.purpose;
    const projectId = state.projectId;

    const systemPrompt = await buildSystemPrompt(purpose, projectId);

    const originalContent = target.content;

    const others = state.messages.filter(
      (m) => m.id !== messageId && m.role !== "error"
    );

    const historyMessages: AiMessage[] = [
      { role: "system", content: systemPrompt },
      ...others.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "assistant", content: originalContent },
      { role: "user", content: CONTINUE_INSTRUCTION },
    ];

    set({
      messages: get().messages.map((m) =>
        m.id === messageId ? { ...m, streaming: true, interrupted: false } : m
      ),
      streaming: true,
      cancelling: false,
      error: null,
    });

    let buffered = originalContent;
    let wasCancelled = false;

    const handle = streamChat(
      {
        messages: historyMessages,
        purpose,
        projectId,
        apiBase: settings.api_base,
        apiKey: settings.api_key,
        model: settings.model,
        temperature: settings.temperature,
      },
      {
        onDelta: (delta) => {
          buffered += delta;
          set({
            messages: get().messages.map((m) =>
              m.id === messageId ? { ...m, content: buffered } : m
            ),
          });
        },
        onCancelled: () => {
          wasCancelled = true;
        },
      }
    );

    activeCancel = handle.cancel;

    try {
      await handle.promise;
      set({
        messages: get().messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: buffered,
                streaming: false,
                interrupted: wasCancelled,
              }
            : m
        ),
        streaming: false,
        cancelling: false,
      });

      void createAiInteraction({
        project_id: projectId,
        purpose,
        prompt: "[继续生成]",
        response: buffered,
        model: settings.model,
      }).catch((e) => console.error("[ai] persist failed", e));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set({
        messages: get().messages.map((m) =>
          m.id === messageId
            ? { ...m, content: buffered, streaming: false, interrupted: false }
            : m
        ),
        streaming: false,
        cancelling: false,
        error: message,
      });
    } finally {
      activeCancel = null;
      if (wasCancelled) set({ error: null });
    }
  },

  cancel() {
    if (!activeCancel) return;
    if (get().cancelling) return;
    set({ cancelling: true });
    void activeCancel();
  },

  clear() {
    set({ messages: [], error: null });
  },
}));

/* ---------------- system prompt 组装 ---------------- */

async function buildSystemPrompt(
  purpose: AiPurpose,
  projectId: string | null
): Promise<string> {
  let systemPrompt = SYSTEM_PROMPTS[purpose] + languageDirective();
  if (!projectId) return systemPrompt;

  const project = useProjectStore
    .getState()
    .projects.find((p) => p.id === projectId);
  if (!project) return systemPrompt;

  try {
    const context = await buildProjectContext(project);
    return `${systemPrompt}

========== 以下是当前项目的相关数据（仅供你归纳参考，不要编造未提供的信息，不要修改任何可信度评分） ==========

${context}

========== 项目数据结束 ==========`;
  } catch (e) {
    console.error("[ai] 项目上下文加载失败", e);
    return systemPrompt;
  }
}