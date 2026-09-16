import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AiChatInput, AiMessage, AiSettings, Mode } from "./types";
import type { ModeSchemaDef } from "./modeData";
import i18n, { languageDirective } from "@/i18n";

/* ---------------- 基础流式调用 ---------------- */

interface StreamEvent {
  request_id: string;
  delta: string;
}

interface DoneEvent {
  request_id: string;
  full: string;
}

interface CancelledEvent {
  request_id: string;
  full: string;
}

interface ErrorEvent {
  request_id: string;
  message: string;
}

export interface StreamCallbacks {
  onDelta?: (delta: string) => void;
  onDone?: (full: string) => void;
  onCancelled?: (full: string) => void;
  onError?: (message: string) => void;
}

export interface StreamChatArgs {
  messages: AiMessage[];
  purpose: string;
  projectId: string | null;
  apiBase: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface StreamHandle {
  requestId: string;
  promise: Promise<string>;
  cancel: () => Promise<void>;
}

export function streamChat(
  args: StreamChatArgs,
  callbacks: StreamCallbacks = {}
): StreamHandle {
  const requestId = makeRequestId();

  const promise = (async () => {
    let unlistenStream: UnlistenFn | null = null;
    let unlistenDone: UnlistenFn | null = null;
    let unlistenCancelled: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;

    try {
      unlistenStream = await listen<StreamEvent>("ai://stream", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onDelta?.(e.payload.delta);
      });
      unlistenDone = await listen<DoneEvent>("ai://done", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onDone?.(e.payload.full);
      });
      unlistenCancelled = await listen<CancelledEvent>(
        "ai://cancelled",
        (e) => {
          if (e.payload.request_id !== requestId) return;
          callbacks.onCancelled?.(e.payload.full);
        }
      );
      unlistenError = await listen<ErrorEvent>("ai://error", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onError?.(e.payload.message);
      });

      const input: AiChatInput = {
        request_id: requestId,
        messages: args.messages,
        purpose: args.purpose,
        project_id: args.projectId,
        api_base: args.apiBase,
        api_key: args.apiKey,
        model: args.model,
        temperature: args.temperature,
      };

      const full = await invoke<string>("ai_chat", { input });
      return full;
    } finally {
      unlistenStream?.();
      unlistenDone?.();
      unlistenCancelled?.();
      unlistenError?.();
    }
  })();

  async function cancel(): Promise<void> {
    try {
      await invoke("ai_cancel", { input: { request_id: requestId } });
    } catch (e) {
      console.warn("[ai] cancel failed", e);
    }
  }

  return { requestId, promise, cancel };
}

function makeRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/* ---------------- 结构化起草（mode_data） ---------------- */

export interface DraftModeDataArgs {
  mode: Mode;
  schema: ModeSchemaDef;
  currentData: string;
  context: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export async function draftModeData(args: DraftModeDataArgs): Promise<string> {
  const systemPrompt =
    buildDraftSystemPrompt(args.mode, args.schema) + languageDirective();
  const userPrompt = buildDraftUserPrompt(args.currentData, args.context);

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: "structured_draft",
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: args.settings.temperature,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

function buildDraftSystemPrompt(mode: Mode, schema: ModeSchemaDef): string {
  // 把 i18n key 翻译成当前语言，给 AI 看
  const fieldsDesc = schema.sections
    .map((s) => {
      const fields = s.fields
        .map((f) => {
          const label = i18n.t(f.labelKey);
          const hint = f.hintKey ? `（提示：${i18n.t(f.hintKey)}）` : "";
          return `  - ${s.key}.${f.key}｜${label}${hint}`;
        })
        .join("\n");
      const sectionTitle = i18n.t(s.titleKey);
      const desc = s.descriptionKey ? `\n${i18n.t(s.descriptionKey)}` : "";
      return `## ${sectionTitle}${desc}\n${fields}`;
    })
    .join("\n\n");

  const MODE_LABEL: Record<Mode, string> = {
    validate_first: "模式 A（有想法，先验证）",
    build_first: "模式 B（有产品，找渠道）",
    portfolio: "模式 C（多产品组合）",
  };

  return `你是 ShipSignal 的结构化信息起草助手。

你的任务：根据用户提供的项目上下文（信号、决策、转化、学习记录），为当前项目生成一份结构化 JSON 数据。

当前模式：${MODE_LABEL[mode]}

字段定义：
${fieldsDesc}

【输出要求，必须严格遵守】
1. 只输出 JSON，不要任何解释文字、不要 markdown 代码块标记
2. JSON 结构为嵌套对象，按 "sectionKey": { "fieldKey": "value" } 组织
3. 字段路径严格遵循上面定义，不要增减字段
4. 没有依据的字段留空字符串 ""
5. 不要编造数据，只从用户提供的上下文中归纳
6. 字段值要具体、可操作，避免"很好"、"不错"这类空话

强调：你不判断数据真假，只做归纳整理。`;
}

function buildDraftUserPrompt(currentData: string, context: string): string {
  const current =
    currentData && currentData.trim() !== "{}"
      ? currentData
      : "（还没有填写任何结构化信息）";
  return `## 当前已有的结构化数据
${current}

## 项目上下文
${context}

请基于以上信息，输出符合字段定义的结构化 JSON。`;
}

/* ---------------- 实体起草（信号 / 转化 / 学习 / 决策） ---------------- */

export type DraftEntityType = "signal" | "conversion" | "lesson" | "decision";

export interface DraftEntityArgs {
  entityType: DraftEntityType;
  rawText: string;
  context: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export async function draftEntity(args: DraftEntityArgs): Promise<string> {
  const { systemPrompt } = buildEntityPrompts(args.entityType);

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt + languageDirective() },
    {
      role: "user",
      content: `## 已有记录（仅供参考格式）
${args.context || "（无）"}

## 原始文本
${args.rawText}

请从原始文本中提取一条 ${args.entityType} 记录，输出严格 JSON。`,
    },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: `draft_${args.entityType}`,
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: args.settings.temperature,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

function buildEntityPrompts(entityType: DraftEntityType): {
  systemPrompt: string;
} {
  const common = `你是 ShipSignal 的数据提取助手。

你的唯一任务：把用户提供的原始文本，转化成一条结构化 JSON 记录。

【硬性规则】
1. 只输出 JSON，不要任何解释文字、不要 markdown 代码块标记
2. 严格按下面的 schema 输出，不要增减字段
3. 文本里没有的信息，字段填 null 或空字符串，不要编造
4. 不判断数据真假，不做评价，只做格式转换
5. 如果文本中确实没有任何可提取的相关信息，输出 {"__empty__": true}`;

  if (entityType === "signal") {
    return {
      systemPrompt: `${common}

【目标 schema：信号】
{
  "signal_type": "string，信号类型，如 user_feedback / platform_metric / payment / market_observation",
  "source": "string 或 null，信号来源，如 小红书 / 抖音 / 用户访谈 / Reddit",
  "source_verifiability": "high | medium | low，来源可验证性。一手数据用 high，公开平台用 medium，口述推测用 low",
  "payment_signal_present": "boolean，文本中是否明确包含付费信息（金额、购买、订阅、付费意向）",
  "data": "object，原始数据字段，如 {\\"likes\\": 320, \\"comments\\": 45}。不确定就留空对象 {}",
  "notes": "string，一句话备注，不要评价，只客观描述"
}

注意：payment_signal_present 只有文本明确提到钱或付费意向时才为 true，不要推测。`,
    };
  }

  if (entityType === "conversion") {
    return {
      systemPrompt: `${common}

【目标 schema：转化记录】
{
  "user_segment": "string 或 null，客群描述，如 荷兰 SaaS 开发者",
  "monetization_form": "string 或 null，变现形态，如 一次性买断 / 订阅 / API 授权 / 定制开发 / 源码授权",
  "amount": "number 或 null，金额数字",
  "currency": "string，币种代码，如 USD / CNY / EUR。不确定默认 USD",
  "recurring": "number，0 表示一次性，1 表示订阅",
  "notes": "string，一句话客观备注"
}

注意：amount 必须是纯数字，不要带货币符号。`,
    };
  }

  if (entityType === "lesson") {
    return {
      systemPrompt: `${common}

【目标 schema：学习信号】
{
  "lesson_type": "validated | invalidated | discovered",
  "description": "string，一句到三句话，客观陈述这条认知",
  "applicable_to": ["string 数组，这条认知适用于什么场景的标签，如 '定价' / '冷启动' / '渠道选择'"]
}

lesson_type 判定：
- validated：某个假设被验证成立
- invalidated：某个假设被推翻
- discovered：新发现的认知，之前没预设过

如果文本里包含多条可提取的学习信号，只提取最主要的那一条。用户会多次调用。`,
    };
  }

  // decision
  return {
    systemPrompt: `${common}

【目标 schema：决策日志】
{
  "decision": "string，做了什么决定，一句话",
  "basis": "string 或 null，依据是什么，基于哪些信息",
  "confidence": "high | medium | low 或 null，做这个决定时的信心"
}

注意：不判断这个决定对不对，只记录。`,
  };
}

/* ---------------- JSON 解析工具 ---------------- */

export function extractJson(
  raw: string
): Record<string, unknown> | null {
  let text = raw.trim();
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) text = codeBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (obj.__empty__ === true) return null;
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}